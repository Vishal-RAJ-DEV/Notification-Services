import { EventEmitter } from 'events';
import { logger } from '../config/logger.js';

export enum NotificationEvents {
  QUEUED = 'notification:queued',
  SENT = 'notification:sent',
  RETRYING = 'notification:retrying',
  DEAD_LETTER = 'notification:dead-letter',
  COMPLETED = 'notification:completed',
  PARTIALLY_FAILED = 'notification:partially_failed',
  FAILED = 'notification:failed',
}

export interface DeliveryEventData {
  notificationId: string;
  deliveryId: string;
  channel: string;
  userId: string;
}

class NotificationEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  emitQueued(data: { notificationId: string; userId: string; channels: string[] }): void {
    logger.info({ event: NotificationEvents.QUEUED, ...data }, 'Notification queued event emitted');
    this.emit(NotificationEvents.QUEUED, data);
  }

  emitSent(data: DeliveryEventData & { messageId: string }): void {
    logger.info({ event: NotificationEvents.SENT, ...data }, 'Delivery sent event emitted');
    this.emit(NotificationEvents.SENT, data);
  }

  emitRetrying(data: DeliveryEventData & { attempt: number }): void {
    logger.warn({ event: NotificationEvents.RETRYING, ...data }, 'Delivery retrying event emitted');
    this.emit(NotificationEvents.RETRYING, data);
  }

  emitDeadLetter(data: DeliveryEventData & { error: string }): void {
    logger.error(
      { event: NotificationEvents.DEAD_LETTER, ...data },
      'Delivery dead-letter event emitted',
    );
    this.emit(NotificationEvents.DEAD_LETTER, data);
  }

  emitCompleted(data: { notificationId: string }): void {
    logger.info({ event: NotificationEvents.COMPLETED, ...data }, 'Notification completed event emitted');
    this.emit(NotificationEvents.COMPLETED, data);
  }

  emitPartiallyFailed(data: { notificationId: string }): void {
    logger.warn(
      { event: NotificationEvents.PARTIALLY_FAILED, ...data },
      'Notification partially failed event emitted',
    );
    this.emit(NotificationEvents.PARTIALLY_FAILED, data);
  }

  emitFailed(data: { notificationId: string }): void {
    logger.error({ event: NotificationEvents.FAILED, ...data }, 'Notification failed event emitted');
    this.emit(NotificationEvents.FAILED, data);
  }
}

export const notificationEventEmitter = new NotificationEventEmitter();
