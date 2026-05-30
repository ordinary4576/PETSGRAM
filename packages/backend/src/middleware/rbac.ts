import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    isVerified: boolean;
  };
}

/**
 * Express Middleware verifying JWT Access Tokens inside Authorization Headers
 */
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Access token missing or invalid format.'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_392a0ef';

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as Role,
      isVerified: !!decoded.isVerified
    };
    return next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN',
      message: 'Access token expired or malformed.'
    });
  }
};

/**
 * Enforces Role-Based Access Control (RBAC) gates
 * @param allowedRoles List of roles permitted to access endpoint
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'User session not authenticated.'
      });
    }

    const hasRole = allowedRoles.includes(req.user.role);

    if (!hasRole) {
      return res.status(403).json({
        status: 'error',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Requires elevated permissions. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    return next();
  };
};

/**
 * Enforces verified email status gates
 */
export const requireEmailVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      status: 'error',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Access denied. Account email verification required.'
    });
  }
  return next();
};
