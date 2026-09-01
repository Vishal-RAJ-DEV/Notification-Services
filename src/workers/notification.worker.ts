import { Worker, type WorkerOptions } from 'bullmq';
import { redisClients } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { QUEUE_NAMES } from '../constants/index.js';
import { processNotificationJob } from '../jobs/notification.job.js';
import type { NotificationJobData } from '../queues/notification.queue.js';

const workerOptions: WorkerOptions = {
  connection: redisClients.worker,
  prefix: env.QUEUE_PREFIX,
  concurrency: 10,
  lockDuration: 30000,
  maxStalledCount: 3,
  stalledInterval: 15000,
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 24 * 3600, count: 500 },
  settings: {
    backoffStrategy: (attemptsMade: number) => {
      return Math.min(2000 * 2 ** attemptsMade, 30000);
    },
  },
};

class NotificationWorker {
  public readonly worker: Worker;

  constructor() {
    this.worker = new Worker<NotificationJobData>(
      QUEUE_NAMES.NOTIFICATION,
      (job) => {
        logger.info(
          { component: 'worker', jobId: job.id, attempt: job.attemptsMade },
          'Worker processing notification delivery job',
        );
        return processNotificationJob(job);
      },
      workerOptions,
    );

    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    this.worker.on('completed', (job) => {
      logger.info(
        { component: 'worker', jobId: job.id, queue: QUEUE_NAMES.NOTIFICATION },
        'Worker completed job',
      );
    });

    this.worker.on('failed', (job, error) => {
      logger.error(
        { component: 'worker', jobId: job?.id, queue: QUEUE_NAMES.NOTIFICATION, err: error },
        'Worker failed job',
      );
    });

    this.worker.on('error', (error) => {
      logger.error(
        { component: 'worker', queue: QUEUE_NAMES.NOTIFICATION, err: error },
        'Worker encountered an error',
      );
    });

    this.worker.on('active', (job) => {
      logger.debug(
        { component: 'worker', jobId: job.id, queue: QUEUE_NAMES.NOTIFICATION },
        'Worker started processing job',
      );
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(
        { component: 'worker', jobId, queue: QUEUE_NAMES.NOTIFICATION },
        'Job stalled, will be picked up by another worker',
      );
    });

    this.worker.on('drained', () => {
      logger.info(
        { component: 'worker', queue: QUEUE_NAMES.NOTIFICATION },
        'Queue drained, no more jobs pending',
      );
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}

export const notificationWorker = new NotificationWorker();
