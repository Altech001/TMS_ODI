import { Router } from 'express';
import { membershipController } from './membership.controller.js';
import {
    authMiddleware,
    orgResolverMiddleware,
    requirePermission,
    validateBody,
    validateParams,
} from '../../middlewares/index.js';
import { updateMemberRoleSchema, memberIdParamSchema } from './membership.dto.js';

const router = Router();

// All routes require auth and org context
router.use(authMiddleware, orgResolverMiddleware);

router.get(
    '/',
    requirePermission('org:read'),
    membershipController.list.bind(membershipController)
);

router.patch(
    '/:memberId/role',
    requirePermission('org:manage_roles'),
    validateParams(memberIdParamSchema),
    validateBody(updateMemberRoleSchema),
    membershipController.updateRole.bind(membershipController)
);

router.delete(
    '/:memberId',
    requirePermission('org:remove_member'),
    validateParams(memberIdParamSchema),
    membershipController.remove.bind(membershipController)
);

export default router;
