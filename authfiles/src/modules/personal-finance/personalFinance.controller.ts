import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { personalFinanceService } from './personalFinance.service.js';
import type {
    CreateAccountInput,
    UpdateAccountInput,
    CreateCategoryInput,
    UpdateCategoryInput,
    CreateTransactionInput,
    UpdateTransactionInput,
    ListTransactionsQuery,
    CreateTransferInput,
    DashboardQuery,
    CategoryBreakdownQuery,
    CreateReportInput,
    ListReportsQuery,
} from './personalFinance.dto.js';

export class PersonalFinanceController {
    // =========================================================================
    // ACCOUNTS
    // =========================================================================

    async createAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const input = req.body as CreateAccountInput;
            const account = await personalFinanceService.createAccount(userId, input);
            res.status(201).json({ success: true, data: account });
        } catch (error) {
            next(error);
        }
    }

    async listAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const includeArchived = req.query.includeArchived === 'true';
            const accounts = await personalFinanceService.listAccounts(userId, includeArchived);
            res.json({ success: true, data: accounts });
        } catch (error) {
            next(error);
        }
    }

    async getAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { accountId } = req.params;
            const account = await personalFinanceService.getAccount(userId, accountId);
            res.json({ success: true, data: account });
        } catch (error) {
            next(error);
        }
    }

    async updateAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { accountId } = req.params;
            const input = req.body as UpdateAccountInput;
            const account = await personalFinanceService.updateAccount(userId, accountId, input);
            res.json({ success: true, data: account });
        } catch (error) {
            next(error);
        }
    }

    async archiveAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { accountId } = req.params;
            const account = await personalFinanceService.archiveAccount(userId, accountId);
            res.json({ success: true, data: account });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // CATEGORIES
    // =========================================================================

    async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const input = req.body as CreateCategoryInput;
            const category = await personalFinanceService.createCategory(userId, input);
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    }

    async listCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const type = req.query.type as any;
            const categories = await personalFinanceService.listCategories(userId, type);
            res.json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { categoryId } = req.params;
            const input = req.body as UpdateCategoryInput;
            const category = await personalFinanceService.updateCategory(userId, categoryId, input);
            res.json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    }

    async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { categoryId } = req.params;
            const result = await personalFinanceService.deleteCategory(userId, categoryId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // TRANSACTIONS
    // =========================================================================

    async createTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const input = req.body as CreateTransactionInput;
            const transaction = await personalFinanceService.createTransaction(userId, input);
            res.status(201).json({ success: true, data: transaction });
        } catch (error) {
            next(error);
        }
    }

    async listTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const query = req.query as unknown as ListTransactionsQuery;
            const result = await personalFinanceService.listTransactions(userId, query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { transactionId } = req.params;
            const transaction = await personalFinanceService.getTransaction(userId, transactionId);
            res.json({ success: true, data: transaction });
        } catch (error) {
            next(error);
        }
    }

    async updateTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { transactionId } = req.params;
            const input = req.body as UpdateTransactionInput;
            const transaction = await personalFinanceService.updateTransaction(userId, transactionId, input);
            res.json({ success: true, data: transaction });
        } catch (error) {
            next(error);
        }
    }

    async deleteTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { transactionId } = req.params;
            const result = await personalFinanceService.deleteTransaction(userId, transactionId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async toggleReconciliation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { transactionId } = req.params;
            const result = await personalFinanceService.toggleReconciliation(userId, transactionId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // TRANSFERS
    // =========================================================================

    async createTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const input = req.body as CreateTransferInput;
            const result = await personalFinanceService.createTransfer(userId, input);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // DASHBOARD & ANALYTICS
    // =========================================================================

    async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const query = req.query as unknown as DashboardQuery;
            const dashboard = await personalFinanceService.getDashboard(userId, query);
            res.json({ success: true, data: dashboard });
        } catch (error) {
            next(error);
        }
    }

    async getCategoryBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const query = req.query as unknown as CategoryBreakdownQuery;
            const breakdown = await personalFinanceService.getCategoryBreakdown(userId, query);
            res.json({ success: true, data: breakdown });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // REPORTS
    // =========================================================================

    async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const input = req.body as CreateReportInput;
            const report = await personalFinanceService.createReport(userId, input);
            res.status(201).json({ success: true, data: report });
        } catch (error) {
            next(error);
        }
    }

    async listReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const query = req.query as unknown as ListReportsQuery;
            const result = await personalFinanceService.listReports(userId, query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getReportDownload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { reportId } = req.params;
            const result = await personalFinanceService.getReportDownloadUrl(userId, reportId);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

export const personalFinanceController = new PersonalFinanceController();
export default personalFinanceController;
