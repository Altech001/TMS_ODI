import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { presenceService } from './presence.service.js';
import type { UpdatePresenceInput } from './presence.dto.js';

export class PresenceController {
    async updateStatus(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdatePresenceInput;
            const result = await presenceService.updatePresence(req.organizationId, req.user.id, input);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async getMyStatus(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const presence = await presenceService.getPresence(req.organizationId, req.user.id);
            res.json({ success: true, data: presence });
        } catch (error) { next(error); }
    }

    async getUserStatus(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const presence = await presenceService.getPresence(req.organizationId, req.params.userId);
            res.json({ success: true, data: presence });
        } catch (error) { next(error); }
    }

    async getOrgPresence(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const presences = await presenceService.getOrgPresence(req.organizationId);
            res.json({ success: true, data: presences });
        } catch (error) { next(error); }
    }

    async getMyHistory(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const history = await presenceService.getPresenceHistory(req.organizationId, req.user.id);
            res.json({ success: true, data: history });
        } catch (error) { next(error); }
    }

    async goOffline(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const result = await presenceService.setOffline(req.organizationId, req.user.id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }
}

export const presenceController = new PresenceController();
export default presenceController;
