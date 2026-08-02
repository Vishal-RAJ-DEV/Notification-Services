import { Router } from 'express';
import {
  sendNotification,
  getNotification,
  listNotifications,
  cancelNotification,
  getNotificationStats,
} from '../controllers/notification.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  sendNotificationSchema,
  notificationIdSchema,
  listNotificationsSchema,
} from '../validators/notification.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

const notificationRateLimiter = rateLimiter({ windowMs: 60 * 1000, maxRequests: 100 });

router.post(
  '/',
  notificationRateLimiter,
  validate(sendNotificationSchema),
  asyncHandler(sendNotification),
);

router.get(
  '/stats',
  asyncHandler(getNotificationStats),
);

router.get(
  '/:id',
  validate(notificationIdSchema, 'params'),
  asyncHandler(getNotification),
);

router.get(
  '/',
  validate(listNotificationsSchema, 'query'),
  asyncHandler(listNotifications),
);

router.patch(
  '/:id/cancel',
  validate(notificationIdSchema, 'params'),
  asyncHandler(cancelNotification),
);

export default router;
