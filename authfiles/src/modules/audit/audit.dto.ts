import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
    entityType: z.string().optional(),
    entityId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
