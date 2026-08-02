import type { Request, Response, NextFunction } from 'express';
import { notificationService } from '../../services/notification.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import { HTTP_STATUS } from '../../constants/index.js';

export async function sendNotification(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const notification = await notificationService.send(req.body);
  res.status(HTTP_STATUS.CREATED).json(
    sendSuccess('Notification queued successfully', notification),
  );
}

export async function getNotification(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const notification = await notificationService.getById(req.params.id);
  res.status(HTTP_STATUS.OK).json(
    sendSuccess('Notification retrieved successfully', notification),
  );
}

export async function listNotifications(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const result = await notificationService.list(req.query, pagination);
  res.status(HTTP_STATUS.OK).json(
    sendSuccess('Notifications retrieved successfully', result.data, result.meta),
  );
}

export async function cancelNotification(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const notification = await notificationService.cancel(req.params.id);
  res.status(HTTP_STATUS.OK).json(
    sendSuccess('Notification cancelled successfully', notification),
  );
}

export async function getNotificationStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const stats = await notificationService.getStats();
  res.status(HTTP_STATUS.OK).json(
    sendSuccess('Notification stats retrieved successfully', stats),
  );
}
