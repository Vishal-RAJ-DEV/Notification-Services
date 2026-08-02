import type { ProviderResponse } from '../../types/index.js';

export interface SendOptions {
  to: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationProvider {
  readonly name: string;
  send(options: SendOptions): Promise<ProviderResponse>;
}
