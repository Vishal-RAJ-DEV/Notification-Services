import mongoose, { Schema, type Document } from 'mongoose';

export type DeliveryChannel = 'push' | 'email' | 'sms';
export type DeliveryStatus = 'queued' | 'sent' | 'failed' | 'dead';

export interface IDelivery extends Document {
  notificationId: mongoose.Types.ObjectId;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  attempts: number;
  lastError: string | null;
  providerMessageId: string | null;
  nextRetryAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'sms'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'dead'],
      default: 'queued',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: IDelivery, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

DeliverySchema.index({ notificationId: 1, channel: 1 }, { unique: true });
DeliverySchema.index({ status: 1, nextRetryAt: 1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);
