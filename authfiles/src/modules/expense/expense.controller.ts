import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { expenseService } from './expense.service.js';
import type {
    CreateExpenseInput,
    UpdateExpenseInput,
    ApproveExpenseInput,
    RejectExpenseInput,
    ListExpensesQuery,
    AggregateExpensesQuery,
} from './expense.dto.js';

export class ExpenseController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as CreateExpenseInput;
            const expense = await expenseService.createExpense(req.organizationId, input, req.user.id);
            res.status(201).json({ success: true, data: expense });
        } catch (error) { next(error); }
    }

    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as ListExpensesQuery;
            const result = await expenseService.listExpenses(req.organizationId, query);
            res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async get(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const expense = await expenseService.getExpense(req.organizationId, req.params.expenseId);
            res.json({ success: true, data: expense });
        } catch (error) { next(error); }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as UpdateExpenseInput;
            const expense = await expenseService.updateExpense(req.organizationId, req.params.expenseId, input, req.user.id);
            res.json({ success: true, data: expense });
        } catch (error) { next(error); }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const result = await expenseService.deleteExpense(req.organizationId, req.params.expenseId, req.user.id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async approve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as ApproveExpenseInput;
            const expense = await expenseService.approveExpense(req.organizationId, req.params.expenseId, input, req.user.id);
            res.json({ success: true, data: expense, message: 'Expense approved' });
        } catch (error) { next(error); }
    }

    async reject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || !req.organizationId) throw new Error('Missing context');
            const input = req.body as RejectExpenseInput;
            const expense = await expenseService.rejectExpense(req.organizationId, req.params.expenseId, input, req.user.id);
            res.json({ success: true, data: expense, message: 'Expense rejected' });
        } catch (error) { next(error); }
    }

    async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const logs = await expenseService.getAuditLogs(req.organizationId, req.params.expenseId);
            res.json({ success: true, data: logs });
        } catch (error) { next(error); }
    }

    async getAggregation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.organizationId) throw new Error('Missing context');
            const query = req.query as AggregateExpensesQuery;
            const aggregation = await expenseService.getAggregation(req.organizationId, query);
            res.json({ success: true, data: aggregation });
        } catch (error) { next(error); }
    }
}

export const expenseController = new ExpenseController();
export default expenseController;
