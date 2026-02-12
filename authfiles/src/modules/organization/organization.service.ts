import type { MemberRole } from '@prisma/client';
import { organizationRepository } from './organization.repository.js';
import { auditService } from '../audit/audit.service.js';
import { notificationService } from '../notification/notification.service.js';
import { authRepository } from '../auth/auth.repository.js';
import { clearOrgMembershipCache, clearOrgCache } from '../../middlewares/orgResolver.js';
import { generateSecureToken, getInviteExpiry } from '../../utils/otp.js';
import { emailQueue } from '../../queues/index.js';
import {
    NotFoundError,
    BadRequestError,
    ForbiddenError,
    ConflictError
} from '../../utils/errors.js';
import type {
    CreateOrganizationInput,
    UpdateOrganizationInput,
    InviteUserInput,
    TransferOwnershipInput,
} from './organization.dto.js';

export class OrganizationService {
    async createOrganization(input: CreateOrganizationInput, userId: string) {
        const organization = await organizationRepository.create({
            name: input.name,
            ownerId: userId,
        });

        return organization;
    }

    async getOrganization(organizationId: string) {
        const organization = await organizationRepository.findByIdWithMembers(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }
        return organization;
    }

    async getUserOrganizations(userId: string) {
        return organizationRepository.getUserOrganizations(userId);
    }

    async updateOrganization(
        organizationId: string,
        input: UpdateOrganizationInput,
        userId: string
    ) {
        const organization = await organizationRepository.findById(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }

        const updated = await organizationRepository.update(organizationId, input);

        await auditService.log({
            organizationId,
            userId,
            entityType: 'Organization',
            entityId: organizationId,
            action: 'UPDATE',
            previousData: { name: organization.name },
            newData: { name: updated.name },
        });

        await clearOrgCache(organizationId);

        return updated;
    }

    async deleteOrganization(organizationId: string, userId: string) {
        const organization = await organizationRepository.findById(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }

        if (organization.ownerId !== userId) {
            throw new ForbiddenError('Only the owner can delete the organization');
        }

        await organizationRepository.softDelete(organizationId);

        await auditService.log({
            organizationId,
            userId,
            entityType: 'Organization',
            entityId: organizationId,
            action: 'DELETE',
        });

        await clearOrgCache(organizationId);

        return { success: true };
    }

    /**
     * PUBLIC: Retrieve invite details to decide if user needs to Login or Signup
     */
    async getInviteDetails(token: string) {
        const invite = await organizationRepository.findInviteByToken(token);
        
        if (!invite) throw new NotFoundError('Invite not found');
        if (invite.status !== 'PENDING') throw new BadRequestError('Invite is no longer valid');
        if (invite.expiresAt < new Date()) throw new BadRequestError('Invite has expired');

        // Check if the user is already registered in the system
        const existingUser = await authRepository.findUserByEmail(invite.email);

        return {
            email: invite.email,
            organizationName: invite.organization.name,
            organizationId: invite.organization.id,
            role: invite.role,
            inviterName: invite.invitedBy.name,
            isUserRegistered: !!existingUser // Frontend uses this to toggle Login vs Signup
        };
    }

    async inviteUser(
        organizationId: string,
        input: InviteUserInput,
        inviterId: string
    ) {
        const organization = await organizationRepository.findById(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }

        // Check if user is already a member
        const existingUser = await authRepository.findUserByEmail(input.email);
        if (existingUser) {
            const existingMember = await organizationRepository.getMember(organizationId, existingUser.id);
            if (existingMember) {
                throw new ConflictError('User is already a member of this organization');
            }
        }

        // Check for existing pending invite
        const existingInvite = await organizationRepository.findPendingInvite(input.email, organizationId);
        if (existingInvite) {
            throw new ConflictError('An invite is already pending for this email');
        }

        // Create invite
        const token = generateSecureToken(32);
        const invite = await organizationRepository.createInvite({
            email: input.email.toLowerCase(),
            organizationId,
            invitedById: inviterId,
            role: input.role as MemberRole,
            token,
            expiresAt: getInviteExpiry(7),
        });

        // Get inviter's name
        const inviter = await authRepository.findUserById(inviterId);

        // Queue email with context (registered vs new user)
        await emailQueue.add('send-invite', {
            email: input.email,
            organizationName: organization.name,
            inviterName: inviter?.name || 'Someone',
            inviteToken: token,
            isRegistered: !!existingUser // Passed to email worker to select template
        });

        return invite;
    }

    async acceptInvite(token: string, userId: string) {
        const invite = await organizationRepository.findInviteByToken(token);
        if (!invite) {
            throw new NotFoundError('Invite not found');
        }

        if (invite.status !== 'PENDING') {
            throw new BadRequestError('Invite has already been used');
        }

        if (invite.expiresAt < new Date()) {
            await organizationRepository.updateInviteStatus(invite.id, 'EXPIRED');
            throw new BadRequestError('Invite has expired');
        }

        // Check if user's email matches invite email
        const user = await authRepository.findUserById(userId);
        if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
            throw new ForbiddenError('This invite is not for your email address');
        }

        // Check if already a member
        const existingMember = await organizationRepository.getMember(invite.organizationId, userId);
        if (existingMember) {
            await organizationRepository.updateInviteStatus(invite.id, 'ACCEPTED');
            throw new ConflictError('You are already a member of this organization');
        }

        // Add as member
        await organizationRepository.addMember(invite.organizationId, userId, invite.role);
        await organizationRepository.updateInviteStatus(invite.id, 'ACCEPTED');

        // Notify inviter
        await notificationService.create({
            userId: invite.invitedById,
            organizationId: invite.organizationId,
            type: 'INVITE_ACCEPTED',
            title: 'Invite Accepted',
            message: `${user.name} has accepted your invitation to join ${invite.organization.name}`,
            data: { invitedUserId: userId },
        });

        return { organizationId: invite.organizationId };
    }

    async declineInvite(token: string, userId: string) {
        const invite = await organizationRepository.findInviteByToken(token);
        if (!invite) {
            throw new NotFoundError('Invite not found');
        }

        if (invite.status !== 'PENDING') {
            throw new BadRequestError('Invite has already been used');
        }

        const user = await authRepository.findUserById(userId);
        if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
            throw new ForbiddenError('This invite is not for your email address');
        }

        await organizationRepository.updateInviteStatus(invite.id, 'DECLINED');

        return { success: true };
    }

    async getPendingInvites(email: string) {
        return organizationRepository.getUserPendingInvites(email);
    }

    async leaveOrganization(organizationId: string, userId: string) {
        const organization = await organizationRepository.findById(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }

        const member = await organizationRepository.getMember(organizationId, userId);
        if (!member) {
            throw new NotFoundError('You are not a member of this organization');
        }

        // Prevent last owner from leaving
        if (member.role === 'OWNER') {
            const ownerCount = await organizationRepository.countOwners(organizationId);
            if (ownerCount <= 1) {
                throw new BadRequestError('Cannot leave: you are the only owner. Transfer ownership first.');
            }
        }

        await organizationRepository.removeMember(organizationId, userId);
        await clearOrgMembershipCache(organizationId, userId);

        await auditService.log({
            organizationId,
            userId,
            entityType: 'OrganizationMember',
            entityId: userId,
            action: 'LEAVE',
        });

        return { success: true };
    }

    async transferOwnership(
        organizationId: string,
        input: TransferOwnershipInput,
        currentOwnerId: string
    ) {
        const organization = await organizationRepository.findById(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }

        if (organization.ownerId !== currentOwnerId) {
            throw new ForbiddenError('Only the owner can transfer ownership');
        }

        if (input.newOwnerId === currentOwnerId) {
            throw new BadRequestError('Cannot transfer ownership to yourself');
        }

        // Verify new owner is a member
        const newOwnerMember = await organizationRepository.getMember(organizationId, input.newOwnerId);
        if (!newOwnerMember) {
            throw new NotFoundError('New owner must be an existing member');
        }

        await organizationRepository.transferOwnership(organizationId, currentOwnerId, input.newOwnerId);

        // Clear caches
        await clearOrgMembershipCache(organizationId, currentOwnerId);
        await clearOrgMembershipCache(organizationId, input.newOwnerId);

        await auditService.log({
            organizationId,
            userId: currentOwnerId,
            entityType: 'Organization',
            entityId: organizationId,
            action: 'TRANSFER_OWNERSHIP',
            previousData: { ownerId: currentOwnerId },
            newData: { ownerId: input.newOwnerId },
        });

        // Notify new owner
        await notificationService.create({
            userId: input.newOwnerId,
            organizationId,
            type: 'ROLE_CHANGED',
            title: 'Ownership Transferred',
            message: `You are now the owner of ${organization.name}`,
            data: { previousOwnerId: currentOwnerId },
        });

        return { success: true };
    }

    async getMembers(organizationId: string) {
        const organization = await organizationRepository.findById(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }

        return organizationRepository.getMembers(organizationId);
    }

    async getOrganizationInvites(organizationId: string) {
        const organization = await organizationRepository.findById(organizationId);
        if (!organization || organization.deletedAt) {
            throw new NotFoundError('Organization not found');
        }

        return organizationRepository.getOrganizationInvites(organizationId);
    }
}

export const organizationService = new OrganizationService();
export default organizationService;