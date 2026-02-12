import type { Response, NextFunction, Request } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { organizationService } from './organization.service.js';
import type {
    CreateOrganizationInput,
    UpdateOrganizationInput,
    InviteUserInput,
    TransferOwnershipInput,
} from './organization.dto.js';

export class OrganizationController {
    // NEW: Public endpoint for invite resolution
    async getInviteInfo(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { token } = req.params;
            const result = await organizationService.getInviteDetails(token);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async create(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input = req.body as CreateOrganizationInput;
            const organization = await organizationService.createOrganization(input, req.user.id);

            res.status(201).json({
                success: true,
                data: organization,
            });
        } catch (error) {
            next(error);
        }
    }

    async list(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const organizations = await organizationService.getUserOrganizations(req.user.id);

            res.json({
                success: true,
                data: organizations,
            });
        } catch (error) {
            next(error);
        }
    }

    async get(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Organization not resolved');

            const organization = await organizationService.getOrganization(req.organizationId);

            res.json({
                success: true,
                data: organization,
            });
        } catch (error) {
            next(error);
        }
    }

    async update(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Organization not resolved');

            const input = req.body as UpdateOrganizationInput;
            const organization = await organizationService.updateOrganization(
                req.organizationId,
                input,
                req.user.id
            );

            res.json({
                success: true,
                data: organization,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Organization not resolved');

            const result = await organizationService.deleteOrganization(req.organizationId, req.user.id);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async invite(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Organization not resolved');

            const input = req.body as InviteUserInput;
            const invite = await organizationService.inviteUser(req.organizationId, input, req.user.id);

            res.status(201).json({
                success: true,
                data: invite,
                message: 'Invitation sent',
            });
        } catch (error) {
            next(error);
        }
    }

    async acceptInvite(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const { token } = req.body as { token: string };
            const result = await organizationService.acceptInvite(token, req.user.id);

            res.json({
                success: true,
                data: result,
                message: 'Invitation accepted',
            });
        } catch (error) {
            next(error);
        }
    }

    async declineInvite(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const { token } = req.body as { token: string };
            const result = await organizationService.declineInvite(token, req.user.id);

            res.json({
                success: true,
                data: result,
                message: 'Invitation declined',
            });
        } catch (error) {
            next(error);
        }
    }

    async getPendingInvites(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const invites = await organizationService.getPendingInvites(req.user.email);

            res.json({
                success: true,
                data: invites,
            });
        } catch (error) {
            next(error);
        }
    }

    async leave(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Organization not resolved');

            const result = await organizationService.leaveOrganization(req.organizationId, req.user.id);

            res.json({
                success: true,
                data: result,
                message: 'Left organization successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async transferOwnership(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Organization not resolved');

            const input = req.body as TransferOwnershipInput;
            const result = await organizationService.transferOwnership(
                req.organizationId,
                input,
                req.user.id
            );

            res.json({
                success: true,
                data: result,
                message: 'Ownership transferred successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getMembers(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Organization not resolved');

            const members = await organizationService.getMembers(req.organizationId);

            res.json({
                success: true,
                data: members,
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationInvites(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Organization not resolved');

            const invites = await organizationService.getOrganizationInvites(req.organizationId);

            res.json({
                success: true,
                data: invites,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const organizationController = new OrganizationController();
export default organizationController;