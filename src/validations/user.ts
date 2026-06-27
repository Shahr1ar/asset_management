import { z } from 'zod';

const baseUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  isActive: z.boolean(),
  image: z.any().optional(),
});

export const userSchema = baseUserSchema.extend({
  referralCode: z.string().trim().optional().or(z.string().length(0)),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.string().length(0)),
  confirmPassword: z.string().optional().or(z.string().length(0)),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }

  return true;
}, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const createUserSchema = baseUserSchema.extend({
  referralCode: z.string().trim().min(3, 'Referral code is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type UserFormValues = z.infer<typeof userSchema>;
export type UserFormInput = UserFormValues;
