import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { membershipService } from './membership.service.js';
import type { UpdateMemberRoleInput } from './membership.dto.js';

export class MembershipController {
    async list(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Organization not resolved');

            const members = await membershipService.getMembers(req.organizationId);

            res.json({
                success: true,
                data: members,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateRole(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Organization not resolved');
            if (!req.memberRole) throw new Error('Role not determined');

            const { memberId } = req.params;
            const input = req.body as UpdateMemberRoleInput;

            const member = await membershipService.updateMemberRole(
                req.organizationId,
                memberId,
                input,
                req.user.id,
                req.memberRole
            );

            res.json({
                success: true,
                data: member,
                message: 'Role updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async remove(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');
            if (!req.organizationId) throw new Error('Organization not resolved');
            if (!req.memberRole) throw new Error('Role not determined');

            const { memberId } = req.params;

            const result = await membershipService.removeMember(
                req.organizationId,
                memberId,
                req.user.id,
                req.memberRole
            );

            res.json({
                success: true,
                data: result,
                message: 'Member removed successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const membershipController = new MembershipController();
export default membershipController;
