import type { Job } from 'bullmq';
import { logger } from '../config/logger.js';
import { deliveryRepository } from '../repositories/delivery.repository.js';
import { notificationService } from '../services/notification.service.js';
import { providerFactory } from '../providers/index.js';
import { notificationEventEmitter } from '../events/index.js';
import type { NotificationJobData } from '../queues/notification.queue.js';
import type { ProviderResponse } from '../types/index.js';

export async function processNotificationJob(
  job: Job<NotificationJobData>,
): Promise<ProviderResponse> {
  const { notificationId, deliveryId, channel, userId, subject, body, metadata } = job.data;

  const delivery = await deliveryRepository.findById(deliveryId);
  if (!delivery) {
    logger.error({ deliveryId }, 'Delivery not found, aborting job');
    throw new Error(`Delivery ${deliveryId} not found`);
  }

  if (delivery.status === 'sent' || delivery.status === 'dead') {
    logger.info(
      { deliveryId, status: delivery.status },
      'Delivery already in terminal state, skipping',
    );
    return { success: true, messageId: delivery.providerMessageId ?? undefined };
  }

  logger.info(
    { notificationId, deliveryId, channel, attempt: job.attemptsMade + 1 },
    'Processing notification delivery',
  );

  const provider = providerFactory.getProvider(channel);
  const result = await provider.send({ to: userId, subject, body, metadata });

  if (result.success) {
    await deliveryRepository.markAsSent(deliveryId, result.messageId ?? '');
    notificationEventEmitter.emitSent({
      notificationId,
      deliveryId,
      channel,
      userId,
      messageId: result.messageId ?? '',
    });
    await notificationService.resolveNotificationStatus(notificationId);
    logger.info(
      { notificationId, deliveryId, messageId: result.messageId },
      'Delivery sent successfully',
    );
    return result;
  }

  const error = result.error ?? 'Unknown provider error';
  const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

  if (isLastAttempt) {
    await deliveryRepository.markAsDeadLetter(deliveryId, error);
    notificationEventEmitter.emitDeadLetter({ notificationId, deliveryId, channel, userId, error });
    await notificationService.resolveNotificationStatus(notificationId);
    logger.error({ notificationId, deliveryId, error }, 'Delivery moved to dead-letter');
    return result;
  }

  const retryDelay = Math.min(2000 * 2 ** job.attemptsMade, 30000);
  await deliveryRepository.markAsFailed(deliveryId, error, new Date(Date.now() + retryDelay));
  notificationEventEmitter.emitRetrying({
    notificationId,
    deliveryId,
    channel,
    userId,
    attempt: job.attemptsMade + 1,
  });
  logger.warn(
    { notificationId, deliveryId, attempt: job.attemptsMade + 1, error },
    'Delivery failed, will retry',
  );

  throw new Error(error);
}
