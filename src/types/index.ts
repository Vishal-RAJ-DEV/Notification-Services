export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'retrying' | 'dead-letter';

export interface SendNotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
