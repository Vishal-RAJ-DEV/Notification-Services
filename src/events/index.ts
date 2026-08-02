import { EventEmitter } from 'events';
import { logger } from '../config/logger.js';

export enum NotificationEvents {
  SENT = 'notification:sent',
  FAILED = 'notification:failed',
  RETRYING = 'notification:retrying',
  DEAD_LETTER = 'notification:dead-letter',
  QUEUED = 'notification:queued',
}

class NotificationEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  emitSent(data: { notificationId: string; channel: string; recipient: string; messageId: string }): void {
    logger.info({ event: NotificationEvents.SENT, ...data }, 'Notification sent event emitted');
    this.emit(NotificationEvents.SENT, data);
  }

  emitFailed(data: { notificationId: string; channel: string; recipient: string; error: string }): void {
    logger.error({ event: NotificationEvents.FAILED, ...data }, 'Notification failed event emitted');
    this.emit(NotificationEvents.FAILED, data);
  }

  emitRetrying(data: { notificationId: string; channel: string; recipient: string; attempt: number }): void {
    logger.warn({ event: NotificationEvents.RETRYING, ...data }, 'Notification retrying event emitted');
    this.emit(NotificationEvents.RETRYING, data);
  }

  emitDeadLetter(data: { notificationId: string; channel: string; recipient: string; error: string }): void {
    logger.error({ event: NotificationEvents.DEAD_LETTER, ...data }, 'Notification dead-letter event emitted');
    this.emit(NotificationEvents.DEAD_LETTER, data);
  }

  emitQueued(data: { notificationId: string; channel: string; recipient: string }): void {
    logger.info({ event: NotificationEvents.QUEUED, ...data }, 'Notification queued event emitted');
    this.emit(NotificationEvents.QUEUED, data);
  }
}

export const notificationEventEmitter = new NotificationEventEmitter();
