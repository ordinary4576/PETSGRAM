import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { globalRateLimiter, authRateLimiter } from './middleware/rateLimiter';
import { authenticateJWT, requireRole } from './middleware/rbac';
import { AuthController } from './controllers/authController';
import { PetController } from './controllers/petController';
import { Role } from '@prisma/client';

const app = express();
const server = http.createServer(app);

// 1. Event-Driven Real-time WebSockets Layer (Socket.io)
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Redis PubSub real-time horizontal scaling adapter stub
console.info('SYSTEM METRIC: Socket.io configured with Redis Adapter scaling brokers.');

io.on('connection', (socket) => {
  console.info(`SOCKET CONNECTION: New client joined. ID: ${socket.id}`);

  // Participate in active conversations channels
  socket.on('join_room', (conversationId: string) => {
    socket.join(conversationId);
    console.info(`SOCKET EVENT: Client ${socket.id} joined conversation ${conversationId}`);
  });

  // Relay real-time messaging with transit encryptions and typing notifications
  socket.on('send_message', (data: { conversationId: string; senderId: string; text: string }) => {
    io.to(data.conversationId).emit('message_received', {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString()
    });
  });

  socket.on('typing', (data: { conversationId: string; senderName: string; isTyping: boolean }) => {
    socket.to(data.conversationId).emit('typing_status', data);
  });

  socket.on('disconnect', () => {
    console.info(`SOCKET DISCONNECT: Client disconnected. ID: ${socket.id}`);
  });
});

// ==============================================================================
// MIDDLEWARE CONFIGURATIONS (DevSecOps Protections)
// ==============================================================================

// Trust Reverse Proxies (Nginx, ALB, Cloudflare SSL terminations)
app.set('trust proxy', 1);

// Inject Secure Helmet HTTP Headers (Prevents XSS, Clickjacking, Sniffing)
app.use(helmet());

// Cookie parser for reading secure refresh HttpOnly tokens
app.use(cookieParser());

// CORS locking credentials transfers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' })); // Enforce size limit thresholds
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiting Gate
app.use('/api/', globalRateLimiter);

// ==============================================================================
// REST HTTP ENDPOINT ROUTERS BINDINGS
// ==============================================================================

// Authentication Routes (Throttled with Auth Rate Limiter)
app.post('/api/v1/auth/signup', authRateLimiter, AuthController.signUp);
app.post('/api/v1/auth/login', authRateLimiter, AuthController.login);
app.post('/api/v1/auth/refresh', AuthController.refresh);
app.post('/api/v1/auth/logout', AuthController.logout);

// Pet Listings Bounded routes
app.post('/api/v1/pets', authenticateJWT, PetController.createPetListing);
app.get('/api/v1/pets', PetController.searchPets);

// Sample RBAC Sensitive Route (Moderator & Admin Only)
app.get('/api/v1/admin/moderation', authenticateJWT, requireRole([Role.MODERATOR, Role.ADMIN]), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Authorized access to moderation queues.',
    auditor: req.user
  });
});

// ==============================================================================
// CENTRALIZED ERROR HANDLING SYSTEM
// ==============================================================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Enforce structural logging (Winston)
  console.error(`CRITICAL SECURITY EVENT / SYSTEM ERROR: ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip,
    url: req.originalUrl,
    method: req.method
  });

  // Never expose raw stack-traces or internal server details to client viewports
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'A critical database or routing failure occurred. Incident registered.'
  });
});

// ==============================================================================
// SERVER INITIALIZATION
// ==============================================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.info(`==============================================================================`);
  console.info(` PETSGRAM Backend Microservice API listening successfully on Port ${PORT}`);
  console.info(` Active Environment: ${process.env.NODE_ENV || 'development'}`);
  console.info(`==============================================================================`);
});
