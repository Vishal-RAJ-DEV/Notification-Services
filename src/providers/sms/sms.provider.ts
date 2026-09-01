import { v4 as uuidv4 } from 'uuid';
import type { NotificationProvider, SendOptions } from '../interfaces/provider.interface.js';
import type { ProviderResponse } from '../../types/index.js';
import { logger } from '../../config/logger.js';

export class SmsProvider implements NotificationProvider {
  readonly name = 'sms';

  async send(options: SendOptions): Promise<ProviderResponse> {
    const messageId = uuidv4();

    logger.info(
      {
        component: 'provider',
        provider: this.name,
        to: options.to,
        messageId,
      },
      'Sending SMS via SmsProvider',
    );

    try {
      // Integration point: Replace with actual SMS sending logic
      // e.g., Twilio, Vonage, AWS SNS, Plivo, etc.
      // await twilioClient.messages.create({ ... });

      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          { component: 'provider', provider: this.name, body: options.body },
          'SMS body (development mode)',
        );
      }

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logger.error(
        { component: 'provider', provider: this.name, to: options.to, err: error },
        'SMS sending failed',
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
      };
    }
  }
}
