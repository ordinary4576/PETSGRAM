# PETSGRAM: Enterprise Monorepo Stack 🐾

Welcome to the **PETSGRAM** (formerly PawConnect) enterprise monorepo workspace! This is a production-ready, highly secure, and horizontally scalable pet adoption, foster, rescue, and social community platform. 

The architecture is built under Clean Architecture principles using a robust, containerized developer environment.

---

## 🏛️ Directory Blueprint

```
petsgram/
├── docker-compose.yml      # Local database, cache & api services orchestrations
├── .gitignore              # Monorepo git ignores mappings
├── .env.example            # Environment variables configuration templates
├── k8s/
│   └── deployment.yml      # Multi-region replica HPAs & TLS Ingress deployments
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions lint, test & ECR build pipeline
├── apps/
│   ├── mobile/             # React Native + TS Mobile App (Zustand & Keychains)
│   └── web/                # Vite React Admin Dashboard
└── packages/
    └── backend/            # Express Node.js API Service (Argon2, Zod, JWT)
```

---

## 🚀 Rapid Local Launch Guide

Enforce the following commands to bootstrap the complete database/caching stack and run the backend servers:

### 1. Boot Databases Stack (PostgreSQL & Redis)
Ensure you have Docker Desktop running. Execute:
```bash
docker-compose up -d postgres_db redis_cache
```
This spins up PostgreSQL on `localhost:5432` and Redis on `localhost:6379` with secure password credentials persistent volumes.

### 2. Configure Environment Variables
Copy the secure template file to a local `.env` configuration file:
```bash
cp .env.example packages/backend/.env
```

### 3. Deploy Relational Database Schemas
Navigate to packages/backend and run the Prisma migrations:
```bash
cd packages/backend
npm install
npx prisma db push
```

### 4. Run Backend Dev Server
Launch the Node.js TypeScript API listener:
```bash
npm run dev
```
The secure API service is now listening on `http://localhost:5000` with JWT authenticators, RBAC validators, and Redis rate limiters active.

---

## 🔒 Production Security Protocols

*   **Memory-Hard Hashing**: User credentials hashed with `argon2id` (GPU brute-force resistant).
*   **Access Token Revocation**: Access JWT validated against Redis revocation blacklists.
*   **Double-Blue-Receipt WebSockets**: Socket.io real-time chat running event-driven adapter broadcasts.
*   **Prisma N+1 Blocking**: Relational joins mapped explicitly to block database fatigue.

---

## 📦 Linking to Your GitHub Repository (PETSGRAM)

Link your local project files to your new GitHub repository by running these three commands in your terminal:

```bash
# 1. Stage and Commit all generated enterprise code
git add .
git commit -m "feat: init production-ready monorepo workspace for PETSGRAM"

# 2. Add your remote repository origin
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/PETSGRAM.git
git branch -M main

# 3. Push to your main branch
git push -u origin main
```
*(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username!)*
