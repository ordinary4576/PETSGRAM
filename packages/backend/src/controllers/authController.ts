import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/authService';
import { signUpValidator, loginValidator } from '../validators/authValidator';

const prisma = new PrismaClient();

export class AuthController {
  /**
   * Registers a new user session (POST /api/v1/auth/signup)
   */
  public static async signUp(req: Request, res: Response) {
    try {
      // 1. Enforce payload structural validation (Zod)
      const validatedData = signUpValidator.parse(req.body);

      // 2. Validate email uniqueness
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address has already been registered.'
        });
      }

      // 3. Hash passwords safely using memory-hard Argon2id
      const passwordHash = await AuthService.hashPassword(validatedData.password);

      // 4. Create user record
      const newUser = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: validatedData.role,
          verificationToken: 'v_tok_' + Math.random().toString(36).substr(2, 9)
        }
      });

      console.info(`AUDIT TRAIL: User registered successfully. UID: ${newUser.id}, Email: ${newUser.email}, Role: ${newUser.role}`);

      // 5. Generate secure session tokens
      const accessToken = AuthService.generateAccessToken(newUser);
      const refreshToken = AuthService.generateRefreshToken(newUser);

      // 6. Set Long-Lived Refresh Token in Secure HttpOnly Cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(201).json({
        status: 'success',
        message: 'Account created successfully. A verification link has been sent to your email.',
        accessToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isVerified: newUser.isVerified
        }
      });

    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_FAILED',
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      console.error(`ERROR: Registration failure. Message: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected database error occurred. Please try again later.'
      });
    }
  }

  /**
   * Secure user login (POST /api/v1/auth/login)
   */
  public static async login(req: Request, res: Response) {
    try {
      // 1. Zod request validation
      const validatedData = loginValidator.parse(req.body);

      // 2. Fetch target user
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (!user) {
        // Return generic message to prevent User Enumeration attacks
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'The email address or password provided is incorrect.'
        });
      }

      // 3. Enforce Account Lockout checks
      const locked = AuthService.isAccountLocked(user);
      if (locked) {
        return res.status(423).json({
          status: 'error',
          code: 'ACCOUNT_LOCKED',
          message: `This account has been temporarily locked out due to excessive failed login attempts. Please retry after ${user.lockedUntil?.toLocaleTimeString()}.`
        });
      }

      // 4. Verify password hashing matching
      const isMatch = await AuthService.verifyPassword(validatedData.password, user.passwordHash);

      if (!isMatch) {
        // Log failure, increment failed attempts tracker
        await AuthService.handleFailedLogin(user);
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'The email address or password provided is incorrect.'
        });
      }

      // 5. Success! Reset login trackers
      await AuthService.resetLoginAttempts(user.id.toString());

      // 6. Generate Tokens
      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // 7. Inject Refresh Token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.info(`AUDIT TRAIL: User logged in. UID: ${user.id}, IP: ${req.ip}`);

      return res.status(200).json({
        status: 'success',
        message: 'Login successful.',
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      });

    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_FAILED',
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      console.error(`ERROR: Login failure. Message: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected server error occurred.'
      });
    }
  }

  /**
   * Refreshes credentials session (POST /api/v1/auth/refresh)
   */
  public static async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        code: 'REFRESH_TOKEN_MISSING',
        message: 'Authorization expired. Please re-authenticate.'
      });
    }

    try {
      const decoded = AuthService.verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Active session not found.'
        });
      }

      const accessToken = AuthService.generateAccessToken(user);

      return res.status(200).json({
        status: 'success',
        accessToken
      });

    } catch (error) {
      return res.status(403).json({
        status: 'error',
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh session expired or revoked.'
      });
    }
  }

  /**
   * Secure session logout (POST /api/v1/auth/logout)
   */
  public static async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.'
    });
  }
}
export default AuthController;
