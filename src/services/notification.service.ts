import { notificationRepository } from '../repositories/notification.repository.js';
import { notificationQueue } from '../queues/notification.queue.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { ValidationError } from '../errors/ValidationError.js';
import type { INotification } from '../models/notification.model.js';
import type { PaginationParams, PaginationMeta } from '../utils/pagination.js';
import type { NotificationChannel, NotificationStatus } from '../types/index.js';

export interface SendNotificationInput {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  priority?: number;
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ListNotificationsInput {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  recipient?: string;
}

export class NotificationService {
  async send(input: SendNotificationInput): Promise<INotification> {
    const notification = await notificationRepository.create({
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject,
      body: input.body,
      priority: input.priority ?? 0,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      metadata: input.metadata,
      status: 'pending',
    });

    await notificationQueue.add(
      {
        notificationId: notification._id.toString(),
        channel: notification.channel,
        recipient: notification.recipient,
        subject: notification.subject,
        body: notification.body,
        metadata: notification.metadata,
      },
      {
        priority: notification.priority,
        delay: notification.scheduledAt
          ? Math.max(0, new Date(notification.scheduledAt).getTime() - Date.now())
          : 0,
      },
    );

    return notification;
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
    if (notification.status !== 'pending') {
      throw new ValidationError(
        { status: ['Only pending notifications can be cancelled'] },
      );
    }

    await notificationQueue.remove(id);

    const updated = await notificationRepository.update(id, {
      status: 'failed',
      errorMessage: 'Cancelled by user',
    });

    if (!updated) {
      throw new NotFoundError(`Notification with id ${id} not found`);
    }

    return updated;
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    const statuses: NotificationStatus[] = ['pending', 'sent', 'failed', 'retrying', 'dead-letter'];
    const channels: NotificationChannel[] = ['email', 'sms', 'push'];

    const [byStatusResults, byChannelResults] = await Promise.all([
      Promise.all(statuses.map((s) => notificationRepository.countByStatus(s))),
      Promise.all(channels.map((c) => notificationRepository.countByChannel(c))),
    ]);

    const byStatus: Record<string, number> = {};
    statuses.forEach((s, i) => { byStatus[s] = byStatusResults[i]; });

    const byChannel: Record<string, number> = {};
    channels.forEach((c, i) => { byChannel[c] = byChannelResults[i]; });

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return { total, byStatus, byChannel };
  }
}

export const notificationService = new NotificationService();
