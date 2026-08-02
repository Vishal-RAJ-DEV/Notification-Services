import { Router } from 'express';
import healthRoutes from './health.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/notifications', notificationRoutes);

export default router;
