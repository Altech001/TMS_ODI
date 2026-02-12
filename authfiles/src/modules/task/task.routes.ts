import { Router } from 'express';
import { taskController } from './task.controller.js';
import {
    authMiddleware,
    orgResolverMiddleware,
    requirePermission,
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/index.js';
import {
    createTaskSchema,
    updateTaskSchema,
    taskIdParamSchema,
    assignTaskSchema,
    updateTaskStatusSchema,
    listTasksQuerySchema,
} from './task.dto.js';

const router = Router();

router.use(authMiddleware, orgResolverMiddleware);

router.post(
    '/',
    requirePermission('task:create'),
    validateBody(createTaskSchema),
    taskController.create.bind(taskController)
);

router.get(
    '/',
    requirePermission('task:read'),
    validateQuery(listTasksQuerySchema),
    taskController.list.bind(taskController)
);

router.get(
    '/:taskId',
    requirePermission('task:read'),
    validateParams(taskIdParamSchema),
    taskController.get.bind(taskController)
);

router.patch(
    '/:taskId',
    requirePermission('task:update'),
    validateParams(taskIdParamSchema),
    validateBody(updateTaskSchema),
    taskController.update.bind(taskController)
);

router.patch(
    '/:taskId/status',
    requirePermission('task:change_status'),
    validateParams(taskIdParamSchema),
    validateBody(updateTaskStatusSchema),
    taskController.updateStatus.bind(taskController)
);

router.delete(
    '/:taskId',
    requirePermission('task:delete'),
    validateParams(taskIdParamSchema),
    taskController.delete.bind(taskController)
);

router.post(
    '/:taskId/assignees',
    requirePermission('task:assign'),
    validateParams(taskIdParamSchema),
    validateBody(assignTaskSchema),
    taskController.assign.bind(taskController)
);

router.delete(
    '/:taskId/assignees/:userId',
    requirePermission('task:assign'),
    validateParams(taskIdParamSchema),
    taskController.unassign.bind(taskController)
);

router.get(
    '/:taskId/activity',
    requirePermission('task:read'),
    validateParams(taskIdParamSchema),
    taskController.getActivityLogs.bind(taskController)
);

export default router;
