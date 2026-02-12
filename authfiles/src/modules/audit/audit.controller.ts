import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { auditService } from './audit.service.js';
import type { ListAuditLogsQuery } from './audit.dto.js';

export class AuditController {
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Organization not resolved');
            const query = req.query as ListAuditLogsQuery;
            const result = await auditService.listLogs(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async getEntityLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Organization not resolved');
            const { entityType, entityId } = req.params;
            const logs = await auditService.getEntityLogs(req.organizationId, entityType, entityId);
            res.json({ success: true, data: logs });
        } catch (error) { next(error); }
    }
}

export const auditController = new AuditController();
export default auditController;
