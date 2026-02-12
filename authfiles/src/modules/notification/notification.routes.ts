import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import {
    authMiddleware,
    optionalOrgResolver,
    validateParams,
    validateQuery,
} from '../../middlewares/index.js';
import { listNotificationsQuerySchema, notificationIdParamSchema } from './notification.dto.js';

const router = Router();

router.use(authMiddleware);

router.get(
    '/',
    optionalOrgResolver,
    validateQuery(listNotificationsQuerySchema),
    notificationController.list.bind(notificationController)
);

router.post(
    '/read-all',
    optionalOrgResolver,
    notificationController.markAllAsRead.bind(notificationController)
);

router.delete(
    '/read',
    notificationController.deleteAllRead.bind(notificationController)
);

router.post(
    '/:notificationId/read',
    validateParams(notificationIdParamSchema),
    notificationController.markAsRead.bind(notificationController)
);

router.delete(
    '/:notificationId',
    validateParams(notificationIdParamSchema),
    notificationController.delete.bind(notificationController)
);

export default router;
