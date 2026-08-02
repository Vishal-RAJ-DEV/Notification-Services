import mongoose from 'mongoose';
import { notificationRepository } from '../repositories/notification.repository.js';
import { deliveryRepository } from '../repositories/delivery.repository.js';
import { notificationQueue } from '../queues/notification.queue.js';
import { notificationEventEmitter } from '../events/index.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { ValidationError } from '../errors/ValidationError.js';
import type { INotification, NotificationPriority } from '../models/notification.model.js';
import type { PaginationParams, PaginationMeta } from '../utils/pagination.js';
import type { NotificationChannel, NotificationStatus } from '../types/index.js';

export interface SendNotificationInput {
  userId: string;
  channels: NotificationChannel[];
  type: string;
  title: string;
  subject?: string;
  body: string;
  priority?: NotificationPriority;
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ListNotificationsInput {
  userId?: string;
  status?: NotificationStatus;
  channel?: NotificationChannel;
}

const QUEUE_PRIORITY: Record<NotificationPriority, number> = {
  high: 1,
  normal: 5,
  low: 10,
};

export class NotificationService {
  async send(input: SendNotificationInput): Promise<INotification> {
    const notification = await notificationRepository.create({
      userId: new mongoose.Types.ObjectId(input.userId),
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.metadata ?? null,
      channels: input.channels,
      priority: input.priority ?? 'normal',
      status: 'pending',
    });

    const delay = input.scheduledAt
      ? Math.max(0, new Date(input.scheduledAt).getTime() - Date.now())
      : 0;
    const priority = QUEUE_PRIORITY[notification.priority];

    for (const channel of input.channels) {
      const delivery = await deliveryRepository.create({
        notificationId: notification._id,
        channel,
        status: 'queued',
      });

      await notificationQueue.add(
        {
          notificationId: notification._id.toString(),
          deliveryId: delivery._id.toString(),
          channel,
          userId: input.userId,
          subject: input.subject,
          body: input.body,
          metadata: input.metadata,
        },
        {
          jobId: delivery._id.toString(),
          priority,
          delay,
        },
      );
    }

    const processed = await notificationRepository.update(notification._id, {
      status: 'processing',
    });

    notificationEventEmitter.emitQueued({
      notificationId: notification._id.toString(),
      userId: input.userId,
      channels: input.channels,
    });

    return processed ?? notification;
  }

  async getById(id: string): Promise<INotification> {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError(`Notification with id ${id} not found`);
    }
    return notification;
  }

  async list(
    filter: ListNotificationsInput,
    pagination: PaginationParams,
  ): Promise<{ data: INotification[]; meta: PaginationMeta }> {
    return notificationRepository.findWithPagination(filter, pagination);
  }

  async cancel(id: string): Promise<INotification> {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError(`Notification with id ${id} not found`);
    }
    if (notification.status === 'completed' || notification.status === 'failed') {
      throw new ValidationError({ status: ['Notification already in a terminal state'] });
    }

    const deliveries = await deliveryRepository.findByNotificationId(id);
    for (const delivery of deliveries) {
      if (delivery.status === 'queued') {
        await notificationQueue.remove(delivery._id.toString());
        await deliveryRepository.markAsDeadLetter(delivery._id, 'Cancelled by user');
      }
    }

    await this.resolveNotificationStatus(id);

    return (await notificationRepository.findById(id)) ?? notification;
  }

  async resolveNotificationStatus(
    notificationId: string | mongoose.Types.ObjectId,
  ): Promise<INotification | null> {
    const deliveries = await deliveryRepository.findByNotificationId(notificationId);
    if (deliveries.length === 0) {
      return null;
    }

    const settled = deliveries.every((d) => d.status === 'sent' || d.status === 'dead');
    if (!settled) {
      return null;
    }

    let status: NotificationStatus;
    if (deliveries.every((d) => d.status === 'sent')) {
      status = 'completed';
    } else if (deliveries.every((d) => d.status === 'dead')) {
      status = 'failed';
    } else {
      status = 'partially_failed';
    }

    const updated = await notificationRepository.updateStatus(notificationId, status);
    if (!updated) {
      return null;
    }

    const notificationIdStr = updated._id.toString();
    if (status === 'completed') {
      notificationEventEmitter.emitCompleted({ notificationId: notificationIdStr });
    } else if (status === 'partially_failed') {
      notificationEventEmitter.emitPartiallyFailed({ notificationId: notificationIdStr });
    } else {
      notificationEventEmitter.emitFailed({ notificationId: notificationIdStr });
    }

    return updated;
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    const statuses: NotificationStatus[] = [
      'pending',
      'processing',
      'completed',
      'partially_failed',
      'failed',
    ];
    const channels: NotificationChannel[] = ['email', 'sms', 'push'];

    const [byStatusResults, byChannelResults] = await Promise.all([
      Promise.all(statuses.map((s) => notificationRepository.countByStatus(s))),
      Promise.all(channels.map((c) => notificationRepository.countByChannel(c))),
    ]);

    const byStatus: Record<string, number> = {};
    statuses.forEach((s, i) => {
      byStatus[s] = byStatusResults[i];
    });

    const byChannel: Record<string, number> = {};
    channels.forEach((c, i) => {
      byChannel[c] = byChannelResults[i];
    });

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return { total, byStatus, byChannel };
  }
}

export const notificationService = new NotificationService();
