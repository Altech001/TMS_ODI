import { auditRepository } from './audit.repository.js';
import { parsePagination, paginatedResponse } from '../../utils/helpers.js';
import type { ListAuditLogsQuery } from './audit.dto.js';

export class AuditService {
    async log(data: {
        organizationId: string;
        userId: string;
        entityType: string;
        entityId: string;
        action: string;
        previousData?: object;
        newData?: object;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return auditRepository.create(data);
    }

    async listLogs(organizationId: string, query: ListAuditLogsQuery) {
        const { skip, take } = parsePagination(query.page, query.limit);
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '50', 10);

        const { data, total } = await auditRepository.findMany(organizationId, {
            entityType: query.entityType,
            entityId: query.entityId,
            userId: query.userId,
            action: query.action,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            skip,
            take,
        });

        return paginatedResponse(data, total, page, limit);
    }

    async getEntityLogs(organizationId: string, entityType: string, entityId: string) {
        return auditRepository.findByEntity(organizationId, entityType, entityId);
    }
}

export const auditService = new AuditService();
export default auditService;
