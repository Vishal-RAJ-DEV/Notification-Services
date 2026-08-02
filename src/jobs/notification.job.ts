import { logger } from '../config/logger.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { providerFactory } from '../providers/index.js';
import type { NotificationJobData } from '../queues/notification.queue.js';
import type { ProviderResponse } from '../types/index.js';

export async function processNotificationJob(data: NotificationJobData): Promise<ProviderResponse> {
  const { notificationId, channel, recipient, subject, body, metadata } = data;

  logger.info(
    { notificationId, channel, recipient },
    'Processing notification job',
  );

  const provider = providerFactory.getProvider(channel);
  const result = await provider.send({
    to: recipient,
    subject,
    body,
    metadata,
  });

  if (result.success) {
    await notificationRepository.markAsSent(notificationId, result.messageId ?? '');
    logger.info(
      { notificationId, messageId: result.messageId },
      'Notification sent successfully',
    );
  } else {
    const notification = await notificationRepository.findById(notificationId);
    if (notification) {
      const newRetryCount = (notification.retryCount || 0) + 1;
      if (newRetryCount >= notification.maxRetries) {
        await notificationRepository.markAsDeadLetter(
          notificationId,
          result.error ?? 'Max retries exceeded',
        );
        logger.error(
          { notificationId, error: result.error },
          'Notification moved to dead-letter queue after max retries',
        );
      } else {
        await notificationRepository.incrementRetryCount(notificationId);
        await notificationRepository.markAsFailed(notificationId, result.error ?? 'Unknown error');
        logger.warn(
          { notificationId, retryCount: newRetryCount, error: result.error },
          'Notification failed, will retry',
        );
      }
    }
  }

  return result;
}
