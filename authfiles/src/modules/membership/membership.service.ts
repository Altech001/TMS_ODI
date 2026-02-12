import type { MemberRole } from '@prisma/client';
import { membershipRepository } from './membership.repository.js';
import { auditService } from '../audit/audit.service.js';
import { notificationService } from '../notification/notification.service.js';
import { clearOrgMembershipCache } from '../../middlewares/orgResolver.js';
import { hasMinimumRole, getRoleWeight } from '../../middlewares/permission.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.js';
import type { UpdateMemberRoleInput } from './membership.dto.js';

export class MembershipService {
    async getMembers(organizationId: string) {
        return membershipRepository.getMembers(organizationId);
    }

    async getMember(organizationId: string, userId: string) {
        const member = await membershipRepository.getMember(organizationId, userId);
        if (!member) {
            throw new NotFoundError('Member not found');
        }
        return member;
    }

    async updateMemberRole(
        organizationId: string,
        memberId: string,
        input: UpdateMemberRoleInput,
        actorId: string,
        actorRole: MemberRole
    ) {
        const member = await membershipRepository.getMemberById(memberId);
        if (!member || member.organizationId !== organizationId) {
            throw new NotFoundError('Member not found');
        }

        if (member.userId === actorId) {
            throw new BadRequestError('Cannot change your own role');
        }

        // Cannot modify owners
        if (member.role === 'OWNER') {
            throw new ForbiddenError('Cannot modify owner role. Use transfer ownership instead.');
        }

        // Cannot promote to owner
        if (input.role === 'OWNER') {
            throw new ForbiddenError('Cannot promote to owner. Use transfer ownership instead.');
        }

        // Can only manage roles lower than your own
        if (getRoleWeight(member.role) >= getRoleWeight(actorRole)) {
            throw new ForbiddenError('Cannot modify role of member with equal or higher role');
        }

        if (getRoleWeight(input.role as MemberRole) >= getRoleWeight(actorRole)) {
            throw new ForbiddenError('Cannot promote member to role equal or higher than your own');
        }

        const previousRole = member.role;
        const updated = await membershipRepository.updateRole(memberId, input.role as MemberRole);

        await clearOrgMembershipCache(organizationId, member.userId);

        await auditService.log({
            organizationId,
            userId: actorId,
            entityType: 'OrganizationMember',
            entityId: memberId,
            action: 'ROLE_CHANGE',
            previousData: { role: previousRole },
            newData: { role: input.role },
        });

        // Notify the member
        await notificationService.create({
            userId: member.userId,
            organizationId,
            type: 'ROLE_CHANGED',
            title: 'Role Updated',
            message: `Your role has been changed from ${previousRole} to ${input.role}`,
            data: { previousRole, newRole: input.role },
        });

        return updated;
    }

    async removeMember(
        organizationId: string,
        memberId: string,
        actorId: string,
        actorRole: MemberRole
    ) {
        const member = await membershipRepository.getMemberById(memberId);
        if (!member || member.organizationId !== organizationId) {
            throw new NotFoundError('Member not found');
        }

        if (member.userId === actorId) {
            throw new BadRequestError('Cannot remove yourself. Use leave organization instead.');
        }

        // Cannot remove owners
        if (member.role === 'OWNER') {
            throw new ForbiddenError('Cannot remove organization owner');
        }

        // Can only remove members with lower role
        if (!hasMinimumRole(actorRole, member.role)) {
            throw new ForbiddenError('Cannot remove member with equal or higher role');
        }

        await membershipRepository.removeMember(memberId);
        await clearOrgMembershipCache(organizationId, member.userId);

        await auditService.log({
            organizationId,
            userId: actorId,
            entityType: 'OrganizationMember',
            entityId: memberId,
            action: 'MEMBER_REMOVED',
            previousData: { userId: member.userId, role: member.role },
        });

        return { success: true };
    }
}

export const membershipService = new MembershipService();
export default membershipService;
