import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface TokenPayload {
  id: string;
  email: string;
  role: Role;
  isVerified: boolean;
}

export class AuthService {
  private static ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback_access_secret_302d9aef';
  private static REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_9afc302d';

  /**
   * Encrypts plaintext password using memory-hard Argon2id
   */
  public static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64MB memory cost
      timeCost: 3,       // 3 iterations
      parallelism: 4     // 4 threads
    });
  }

  /**
   * Asserts plaintext matches hash signature
   */
  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (e) {
      return false;
    }
  }

  /**
   * Generates a short-lived JWT Access Token
   */
  public static generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: '15m' // 15 minutes validity
    });
  }

  /**
   * Generates a long-lived JWT Refresh Token
   */
  public static generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: '7d' // 7 days validity
    });
  }

  /**
   * Verifies Long-lived Refresh Token
   */
  public static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as TokenPayload;
  }

  /**
   * Implements Account Lockout gates checks
   */
  public static isAccountLocked(user: User): boolean {
    if (!user.lockedUntil) return false;
    const now = new Date();
    return user.lockedUntil > now;
  }

  /**
   * Records a failed login attempt, locks account if thresholds are met
   */
  public static async handleFailedLogin(user: User): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    let lockedUntil: Date | null = null;

    if (attempts >= 5) {
      // Lock account for 15 minutes after 5 failures
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      console.warn(`SECURITY ALERT: Account ${user.email} locked out until ${lockedUntil.toISOString()} due to excessive login failures.`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil
      }
    });
  }

  /**
   * Resets lockout trackers on successful sign in
   */
  public static async resetLoginAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }
}
export default AuthService;
