export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partially_failed'
  | 'failed';

export interface SendNotificationPayload {
  userId: string;
  channels: NotificationChannel[];
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
