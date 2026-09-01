import { z } from 'zod';

export const sendNotificationSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  channels: z
    .array(z.enum(['email', 'sms', 'push']), {
      errorMap: () => ({ message: 'Channels must be one of: email, sms, push' }),
    })
    .min(1, 'At least one channel is required'),
  type: z.string().min(1, 'Type is required').max(100, 'Type must be at most 100 characters'),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be at most 500 characters'),
  subject: z.string().max(500, 'Subject must be at most 500 characters').optional(),
  body: z.string().min(1, 'Body is required').max(10000, 'Body must be at most 10000 characters'),
  priority: z
    .enum(['high', 'normal', 'low'], {
      errorMap: () => ({ message: 'Priority must be one of: high, normal, low' }),
    })
    .optional()
    .default('normal'),
  scheduledAt: z.string().datetime('ScheduledAt must be a valid ISO datetime').optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID format'),
});

export const listNotificationsSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'partially_failed', 'failed']).optional(),
  channel: z.enum(['email', 'sms', 'push']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
