import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger, correlationMiddleware } from './middlewares/logger.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import organizationRoutes from './modules/organization/organization.routes.js';
import membershipRoutes from './modules/membership/membership.routes.js';
import projectRoutes from './modules/project/project.routes.js';
import taskRoutes from './modules/task/task.routes.js';
import expenseRoutes from './modules/expense/expense.routes.js';
import presenceRoutes from './modules/presence/presence.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import personalFinanceRoutes from './modules/personal-finance/personalFinance.routes.js';
import orgFinanceRoutes from './modules/org-finance/orgFinance.routes.js';

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS
// app.use(cors({
//     origin: config.env === 'production'
//         ? config.appUrl
//         : ['http://localhost:3000', 'http://localhost:5173'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-Correlation-Id'],
// }));

app.use(cors({
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-Correlation-Id'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(correlationMiddleware);
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
    });
});

// API routes 
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/members', membershipRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/personal-finance', personalFinanceRoutes);
app.use('/api/org-finance', orgFinanceRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'The requested resource was not found',
    });
});

// Error handler
app.use(errorHandler);

export default app;
