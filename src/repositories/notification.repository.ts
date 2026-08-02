import mongoose, { type FilterQuery } from 'mongoose';
import {
  Notification,
  type INotification,
  type NotificationStatus,
} from '../models/notification.model.js';
import { Delivery, type DeliveryChannel } from '../models/delivery.model.js';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return Notification.create(data);
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<INotification | null> {
    return Notification.findById(id);
  }

  async findWithPagination(
    filter: { userId?: string; status?: NotificationStatus; channel?: DeliveryChannel },
    pagination: { page: number; limit: number; skip: number },
  ): Promise<PaginatedResult<INotification>> {
    const query: FilterQuery<INotification> = {};
    if (filter.userId) {
      query.userId = filter.userId;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.channel) {
      query._id = {
        $in: await Delivery.distinct('notificationId', { channel: filter.channel }),
      };
    }

    const [data, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      data: data as unknown as INotification[],
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async update(
    id: string | mongoose.Types.ObjectId,
    data: Partial<INotification>,
  ): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async updateStatus(
    id: string | mongoose.Types.ObjectId,
    status: NotificationStatus,
    allowedFrom: NotificationStatus[] = ['pending', 'processing'],
  ): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: id, status: { $in: allowedFrom } },
      { $set: { status } },
      { new: true },
    );
  }

  async countByStatus(status: NotificationStatus): Promise<number> {
    return Notification.countDocuments({ status });
  }

  async countByChannel(channel: DeliveryChannel): Promise<number> {
    return Delivery.countDocuments({ channel });
  }

  async findUnreadByUser(
    userId: string | mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<INotification>> {
    const skip = (page - 1) * limit;
    const filter = { userId, readAt: null };

    const [data, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      data: data as unknown as INotification[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByUser(
    userId: string | mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<INotification>> {
    const skip = (page - 1) * limit;
    const filter = { userId };

    const [data, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      data: data as unknown as INotification[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(
    id: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId,
  ): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { readAt: new Date() } },
      { new: true },
    );
  }

  async markAllAsRead(
    userId: string | mongoose.Types.ObjectId,
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await Notification.updateMany(
      { userId, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async getUnreadCount(userId: string | mongoose.Types.ObjectId): Promise<number> {
    return Notification.countDocuments({ userId, readAt: null });
  }
}

export const notificationRepository = new NotificationRepository();
