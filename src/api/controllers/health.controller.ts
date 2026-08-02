import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { redisClients } from '../../config/redis.js';
import { env } from '../../config/env.js';

export async function getHealth(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : 'disconnected';

  let redisStatus = 'disconnected';
  try {
    const pingResult = await redisClients.queue.ping();
    redisStatus = pingResult === 'PONG' ? 'connected' : 'disconnected';
  } catch {
    redisStatus = 'disconnected';
  }

  const healthData = {
    status: mongoStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
    redis: redisStatus,
    memory: process.memoryUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    environment: env.NODE_ENV,
    serviceName: env.SERVICE_NAME,
  };

  const httpStatus = healthData.status === 'healthy' ? 200 : 503;
  res.status(httpStatus).json(healthData);
}
