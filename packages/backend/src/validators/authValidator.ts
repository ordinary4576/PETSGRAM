import { z } from 'zod';

/**
 * Enterprise validation schema for user registration (Sign Up)
 */
export const signUpValidator = z.object({
  name: z.string()
    .min(2, { message: 'Name must contain at least 2 characters.' })
    .max(100, { message: 'Name must not exceed 100 characters.' }),
  
  email: z.string()
    .email({ message: 'Invalid email address syntax.' }),
  
  password: z.string()
    .min(8, { message: 'Password must contain at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one numerical digit.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character symbol.' }),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid E.164 phone number formatting.' })
    .optional(),
  
  role: z.enum(['USER', 'FOSTER', 'SHELTER']).default('USER'),
  
  location: z.string()
    .min(3, { message: 'Location must be at least 3 characters.' })
    .optional()
});

/**
 * Enterprise validation schema for login credentials
 */
export const loginValidator = z.object({
  email: z.string()
    .email({ message: 'Invalid email address.' }),
  
  password: z.string()
    .min(1, { message: 'Password cannot be empty.' })
});

/**
 * Schema for password reset triggers
 */
export const passwordResetRequestValidator = z.object({
  email: z.string()
    .email({ message: 'Invalid email address.' })
});

/**
 * Schema for password reset completions
 */
export const passwordResetConfirmValidator = z.object({
  token: z.string()
    .min(1, { message: 'Verification token is required.' }),
  
  newPassword: z.string()
    .min(8, { message: 'Password must contain at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one numerical digit.' })
});
export type SignUpInput = z.infer<typeof signUpValidator>;
export type LoginInput = z.infer<typeof loginValidator>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestValidator>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmValidator>;
