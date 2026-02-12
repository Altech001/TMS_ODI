import { Router } from 'express';
import { expenseController } from './expense.controller.js';
import {
    authMiddleware,
    orgResolverMiddleware,
    requirePermission,
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/index.js';
import {
    createExpenseSchema,
    updateExpenseSchema,
    expenseIdParamSchema,
    approveExpenseSchema,
    rejectExpenseSchema,
    listExpensesQuerySchema,
    aggregateExpensesQuerySchema,
} from './expense.dto.js';

const router = Router();

router.use(authMiddleware, orgResolverMiddleware);

router.post(
    '/',
    requirePermission('expense:create'),
    validateBody(createExpenseSchema),
    expenseController.create.bind(expenseController)
);

router.get(
    '/',
    requirePermission('expense:read'),
    validateQuery(listExpensesQuerySchema),
    expenseController.list.bind(expenseController)
);

router.get(
    '/aggregation',
    requirePermission('expense:read'),
    validateQuery(aggregateExpensesQuerySchema),
    expenseController.getAggregation.bind(expenseController)
);

router.get(
    '/:expenseId',
    requirePermission('expense:read'),
    validateParams(expenseIdParamSchema),
    expenseController.get.bind(expenseController)
);

router.patch(
    '/:expenseId',
    requirePermission('expense:update'),
    validateParams(expenseIdParamSchema),
    validateBody(updateExpenseSchema),
    expenseController.update.bind(expenseController)
);

router.delete(
    '/:expenseId',
    requirePermission('expense:delete'),
    validateParams(expenseIdParamSchema),
    expenseController.delete.bind(expenseController)
);

router.post(
    '/:expenseId/approve',
    requirePermission('expense:approve'),
    validateParams(expenseIdParamSchema),
    validateBody(approveExpenseSchema),
    expenseController.approve.bind(expenseController)
);

router.post(
    '/:expenseId/reject',
    requirePermission('expense:reject'),
    validateParams(expenseIdParamSchema),
    validateBody(rejectExpenseSchema),
    expenseController.reject.bind(expenseController)
);

router.get(
    '/:expenseId/audit',
    requirePermission('expense:read'),
    validateParams(expenseIdParamSchema),
    expenseController.getAuditLogs.bind(expenseController)
);

export default router;
