import { Router } from 'express';
import { projectController } from './project.controller.js';
import {
    authMiddleware,
    orgResolverMiddleware,
    requirePermission,
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/index.js';
import {
    createProjectSchema,
    updateProjectSchema,
    projectIdParamSchema,
    addProjectMemberSchema,
    listProjectsQuerySchema,
} from './project.dto.js';

const router = Router();

// All routes require auth and org context
router.use(authMiddleware, orgResolverMiddleware);

router.post(
    '/',
    requirePermission('project:create'),
    validateBody(createProjectSchema),
    projectController.create.bind(projectController)
);

router.get(
    '/',
    requirePermission('project:read'),
    validateQuery(listProjectsQuerySchema),
    projectController.list.bind(projectController)
);

router.get(
    '/:projectId',
    requirePermission('project:read'),
    validateParams(projectIdParamSchema),
    projectController.get.bind(projectController)
);

router.patch(
    '/:projectId',
    requirePermission('project:update'),
    validateParams(projectIdParamSchema),
    validateBody(updateProjectSchema),
    projectController.update.bind(projectController)
);

router.delete(
    '/:projectId',
    requirePermission('project:delete'),
    validateParams(projectIdParamSchema),
    projectController.delete.bind(projectController)
);

router.post(
    '/:projectId/archive',
    requirePermission('project:archive'),
    validateParams(projectIdParamSchema),
    projectController.archive.bind(projectController)
);

router.post(
    '/:projectId/unarchive',
    requirePermission('project:archive'),
    validateParams(projectIdParamSchema),
    projectController.unarchive.bind(projectController)
);

router.get(
    '/:projectId/members',
    requirePermission('project:read'),
    validateParams(projectIdParamSchema),
    projectController.getMembers.bind(projectController)
);

router.post(
    '/:projectId/members',
    requirePermission('project:manage_members'),
    validateParams(projectIdParamSchema),
    validateBody(addProjectMemberSchema),
    projectController.addMember.bind(projectController)
);

router.delete(
    '/:projectId/members/:userId',
    requirePermission('project:manage_members'),
    validateParams(projectIdParamSchema),
    projectController.removeMember.bind(projectController)
);

router.get(
    '/:projectId/stats',
    requirePermission('project:read'),
    validateParams(projectIdParamSchema),
    projectController.getStats.bind(projectController)
);

export default router;
