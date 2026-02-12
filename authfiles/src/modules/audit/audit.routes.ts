import { Router } from 'express';
import { auditController } from './audit.controller.js';
import {
    authMiddleware,
    orgResolverMiddleware,
    requirePermission,
    validateQuery,
} from '../../middlewares/index.js';
import { listAuditLogsQuerySchema } from './audit.dto.js';

const router = Router();

router.use(authMiddleware, orgResolverMiddleware);

router.get(
    '/',
    requirePermission('audit:read'),
    validateQuery(listAuditLogsQuerySchema),
    auditController.list.bind(auditController)
);

router.get(
    '/:entityType/:entityId',
    requirePermission('audit:read'),
    auditController.getEntityLogs.bind(auditController)
);

export default router;
