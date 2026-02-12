import { Router } from 'express';
import { organizationController } from './organization.controller.js';
import {
    authMiddleware,
    orgResolverMiddleware,
    requirePermission,
    validateBody,
} from '../../middlewares/index.js';
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    inviteUserSchema,
    acceptInviteSchema,
    transferOwnershipSchema,
} from './organization.dto.js';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================================================


// ============================================================================
// AUTHENTICATION BARRIER
// ============================================================================
// All routes below this line require a valid JWT access token
router.use(authMiddleware);

// ============================================================================
// PROTECTED ROUTES (Organization Context Agnostic)
// ============================================================================

router.post(
    '/',
    validateBody(createOrganizationSchema),
    organizationController.create.bind(organizationController)
);

router.get(
    '/',
    organizationController.list.bind(organizationController)
);

router.get(
    '/invites/pending',
    organizationController.getPendingInvites.bind(organizationController)
);

router.get(
    '/invites/:token',
    organizationController.getInviteInfo.bind(organizationController)
);

// These actions happen AFTER the user is authenticated (via login or signup)
router.post(
    '/invites/accept',
    validateBody(acceptInviteSchema),
    organizationController.acceptInvite.bind(organizationController)
);

router.post(
    '/invites/decline',
    validateBody(acceptInviteSchema),
    organizationController.declineInvite.bind(organizationController)
);

// ============================================================================
// PROTECTED ROUTES (With Organization Context)
// ============================================================================

router.get(
    '/current',
    orgResolverMiddleware,
    requirePermission('org:read'),
    organizationController.get.bind(organizationController)
);

router.patch(
    '/current',
    orgResolverMiddleware,
    requirePermission('org:update'),
    validateBody(updateOrganizationSchema),
    organizationController.update.bind(organizationController)
);

router.delete(
    '/current',
    orgResolverMiddleware,
    requirePermission('org:delete'),
    organizationController.delete.bind(organizationController)
);

router.get(
    '/current/members',
    orgResolverMiddleware,
    requirePermission('org:read'),
    organizationController.getMembers.bind(organizationController)
);

router.post(
    '/current/invite',
    orgResolverMiddleware,
    requirePermission('org:invite'),
    validateBody(inviteUserSchema),
    organizationController.invite.bind(organizationController)
);

router.post(
    '/current/leave',
    orgResolverMiddleware,
    organizationController.leave.bind(organizationController)
);

router.post(
    '/current/transfer-ownership',
    orgResolverMiddleware,
    requirePermission('org:transfer_ownership'),
    validateBody(transferOwnershipSchema),
    organizationController.transferOwnership.bind(organizationController)
);

export default router;