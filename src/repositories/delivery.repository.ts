import mongoose from 'mongoose';
import { Delivery, type IDelivery, type DeliveryChannel } from '../models/delivery.model.js';
import type { PaginatedResult } from './notification.repository.js';

export class DeliveryRepository {
  async create(data: Partial<IDelivery>): Promise<IDelivery> {
    return Delivery.create(data);
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IDelivery | null> {
    return Delivery.findById(id);
  }

  async updateStatus(
    id: string | mongoose.Types.ObjectId,
    statusFields: Partial<Pick<IDelivery, 'status' | 'attempts' | 'lastError' | 'providerMessageId' | 'nextRetryAt' | 'sentAt'>>,
  ): Promise<IDelivery | null> {
    return Delivery.findByIdAndUpdate(id, { $set: statusFields }, { new: true });
  }

  async findDeadDeliveries(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<IDelivery>> {
    const skip = (page - 1) * limit;
    const filter = { status: 'dead' as const };

    const [data, total] = await Promise.all([
      Delivery.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments(filter),
    ]);

    return {
      data: data as unknown as IDelivery[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByNotificationId(
    notificationId: string | mongoose.Types.ObjectId,
  ): Promise<IDelivery[]> {
    return Delivery.find({ notificationId });
  }

  async findByNotificationAndChannel(
    notificationId: string | mongoose.Types.ObjectId,
    channel: DeliveryChannel,
  ): Promise<IDelivery | null> {
    return Delivery.findOne({ notificationId, channel });
  }

  async markAsSent(
    id: string | mongoose.Types.ObjectId,
    providerMessageId: string,
  ): Promise<IDelivery | null> {
    return this.updateStatus(id, {
      status: 'sent',
      providerMessageId,
      sentAt: new Date(),
    });
  }

  async markAsFailed(
    id: string | mongoose.Types.ObjectId,
    lastError: string,
    nextRetryAt?: Date,
  ): Promise<IDelivery | null> {
    return this.updateStatus(id, { status: 'failed', lastError, nextRetryAt });
  }

  async markAsDeadLetter(
    id: string | mongoose.Types.ObjectId,
    lastError: string,
  ): Promise<IDelivery | null> {
    return this.updateStatus(id, { status: 'dead', lastError });
  }

  async incrementRetryCount(
    id: string | mongoose.Types.ObjectId,
  ): Promise<IDelivery | null> {
    return Delivery.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });
  }

  async countByChannel(channel: DeliveryChannel): Promise<number> {
    return Delivery.countDocuments({ channel });
  }
}

export const deliveryRepository = new DeliveryRepository();
