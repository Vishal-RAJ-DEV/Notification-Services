import { Queue, QueueEvents, type QueueOptions } from 'bullmq';
import { redisClients } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/index.js';
import type { NotificationChannel } from '../types/index.js';

export interface NotificationJobData {
  notificationId: string;
  deliveryId: string;
  channel: NotificationChannel;
  userId: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

const queueOptions: QueueOptions = {
  connection: redisClients.queue,
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
};

class NotificationQueue {
  public readonly queue: Queue<NotificationJobData>;
  public readonly events: QueueEvents;

  constructor() {
    this.queue = new Queue<NotificationJobData>(QUEUE_NAMES.NOTIFICATION, queueOptions);
    this.events = new QueueEvents(QUEUE_NAMES.NOTIFICATION, {
      connection: redisClients.events,
      prefix: env.QUEUE_PREFIX,
    });
    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    this.events.on('completed', ({ jobId, returnvalue }) => {
      logger.info(
        { component: 'queue', queue: QUEUE_NAMES.NOTIFICATION, jobId, returnvalue },
        'Job completed successfully',
      );
    });

    this.events.on('failed', ({ jobId, failedReason }) => {
      logger.error(
        { component: 'queue', queue: QUEUE_NAMES.NOTIFICATION, jobId, failedReason },
        'Job failed',
      );
    });

    this.events.on('progress', ({ jobId, data }) => {
      logger.debug(
        { component: 'queue', queue: QUEUE_NAMES.NOTIFICATION, jobId, progress: data },
        'Job progress update',
      );
    });

    this.events.on('waiting', ({ jobId }) => {
      logger.debug(
        { component: 'queue', queue: QUEUE_NAMES.NOTIFICATION, jobId },
        'Job is waiting',
      );
    });

    this.events.on('active', ({ jobId }) => {
      logger.debug(
        { component: 'queue', queue: QUEUE_NAMES.NOTIFICATION, jobId },
        'Job is active',
      );
    });
  }

  async add(
    data: NotificationJobData,
    opts?: { jobId?: string; priority?: number; delay?: number },
  ): Promise<string> {
    const job = await this.queue.add(JOB_NAMES.SEND_NOTIFICATION, data, {
      jobId: opts?.jobId,
      priority: opts?.priority ?? 0,
      delay: opts?.delay ?? 0,
    });
    logger.info(
      {
        component: 'queue',
        jobId: job.id,
        deliveryId: data.deliveryId,
        channel: data.channel,
        userId: data.userId,
      },
      'Notification delivery job added to queue',
    );
    return job.id ?? '';
  }

  async remove(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info({ component: 'queue', jobId }, 'Notification job removed from queue');
    }
  }

  async getJobCounts() {
    return this.queue.getJobCounts();
  }

  async drain(): Promise<void> {
    await this.queue.drain();
  }

  async close(): Promise<void> {
    await this.events.close();
    await this.queue.close();
  }
}

export const notificationQueue = new NotificationQueue();
