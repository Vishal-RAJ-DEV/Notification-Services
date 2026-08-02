import { z } from 'zod';

export const sendNotificationSchema = z.object({
  channel: z.enum(['email', 'sms', 'push'], {
    errorMap: () => ({ message: 'Channel must be one of: email, sms, push' }),
  }),
  recipient: z
    .string()
    .min(1, 'Recipient is required')
    .max(500, 'Recipient must be at most 500 characters'),
  subject: z
    .string()
    .max(500, 'Subject must be at most 500 characters')
    .optional(),
  body: z.string().min(1, 'Body is required').max(10000, 'Body must be at most 10000 characters'),
  priority: z
    .number()
    .int()
    .min(0, 'Priority must be between 0 and 10')
    .max(10, 'Priority must be between 0 and 10')
    .optional()
    .default(0),
  scheduledAt: z
    .string()
    .datetime('ScheduledAt must be a valid ISO datetime')
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID format'),
});

export const listNotificationsSchema = z.object({
  channel: z.enum(['email', 'sms', 'push']).optional(),
  status: z.enum(['pending', 'sent', 'failed', 'retrying', 'dead-letter']).optional(),
  recipient: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
