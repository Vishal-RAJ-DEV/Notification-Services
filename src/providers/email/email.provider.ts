import type { NotificationProvider } from '../interfaces/provider.interface.js';
import type { SendOptions } from '../interfaces/provider.interface.js';
import type { ProviderResponse } from '../../types/index.js';
import { logger } from '../../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class EmailProvider implements NotificationProvider {
  readonly name = 'email';

  async send(options: SendOptions): Promise<ProviderResponse> {
    const messageId = uuidv4();

    logger.info(
      {
        component: 'provider',
        provider: this.name,
        to: options.to,
        subject: options.subject,
        messageId,
      },
      'Sending email via EmailProvider',
    );

    try {
      // Integration point: Replace with actual email sending logic
      // e.g., SendGrid, SES, Mailgun, Postmark, etc.
      // await sendgridClient.send({ ... });

      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          { component: 'provider', provider: this.name, body: options.body },
          'Email body (development mode)',
        );
      }

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logger.error(
        { component: 'provider', provider: this.name, to: options.to, err: error },
        'Email sending failed',
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }
}
