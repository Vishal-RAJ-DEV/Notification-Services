import type { NotificationProvider } from './interfaces/provider.interface.js';
import type { NotificationChannel } from '../types/index.js';
import { EmailProvider } from './email/email.provider.js';
import { SmsProvider } from './sms/sms.provider.js';
import { PushProvider } from './push/push.provider.js';
import { ValidationError } from '../errors/ValidationError.js';

class ProviderFactory {
  private providers: Map<NotificationChannel, NotificationProvider>;

  constructor() {
    this.providers = new Map();
    this.registerProviders();
  }

  private registerProviders(): void {
    this.providers.set('email', new EmailProvider());
    this.providers.set('sms', new SmsProvider());
    this.providers.set('push', new PushProvider());
  }

  getProvider(channel: NotificationChannel): NotificationProvider {
    const provider = this.providers.get(channel);
    if (!provider) {
      throw new ValidationError(
        { channel: [`No provider registered for channel: ${channel}`] },
      );
    }
    return provider;
  }

  registerProvider(channel: NotificationChannel, provider: NotificationProvider): void {
    this.providers.set(channel, provider);
  }

  getAllProviders(): NotificationProvider[] {
    return Array.from(this.providers.values());
  }
}

export const providerFactory = new ProviderFactory();
