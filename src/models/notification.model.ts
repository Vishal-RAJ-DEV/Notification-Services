import mongoose, { Schema, type Document } from 'mongoose';

export type NotificationChannel = 'push' | 'email' | 'sms';
export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partially_failed'
  | 'failed';
export type NotificationPriority = 'high' | 'normal' | 'low';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channels: NotificationChannel[];
  status: NotificationStatus;
  readAt: Date | null;
  priority: NotificationPriority;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: null,
    },
    channels: {
      type: [
        {
          type: String,
          enum: ['push', 'email', 'sms'],
        },
      ],
      required: true,
      validate: {
        validator(value: NotificationChannel[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one channel is required',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'partially_failed', 'failed'],
      default: 'pending',
    },
    readAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['high', 'normal', 'low'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: INotification, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
