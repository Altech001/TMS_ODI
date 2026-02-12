import { Router } from 'express';
import { presenceController } from './presence.controller.js';
import { authMiddleware, orgResolverMiddleware, validateBody } from '../../middlewares/index.js';
import { updatePresenceSchema } from './presence.dto.js';

const router = Router();

router.use(authMiddleware, orgResolverMiddleware);

router.patch(
    '/me',
    validateBody(updatePresenceSchema),
    presenceController.updateStatus.bind(presenceController)
);

router.get(
    '/me',
    presenceController.getMyStatus.bind(presenceController)
);

router.get(
    '/me/history',
    presenceController.getMyHistory.bind(presenceController)
);

router.post(
    '/me/offline',
    presenceController.goOffline.bind(presenceController)
);

router.get(
    '/org',
    presenceController.getOrgPresence.bind(presenceController)
);

router.get(
    '/:userId',
    presenceController.getUserStatus.bind(presenceController)
);

export default router;
