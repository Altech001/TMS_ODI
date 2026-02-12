import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authMiddleware, authRateLimiter, validateBody } from '../../middlewares/index.js';
import {
    signupSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    changePasswordSchema,
} from './auth.dto.js';

const router = Router();

// Public routes (with rate limiting)
router.post(
    '/signup',
    authRateLimiter(),
    validateBody(signupSchema),
    authController.signup.bind(authController)
);

router.post(
    '/login',
    authRateLimiter(),
    validateBody(loginSchema),
    authController.login.bind(authController)
);

router.post(
    '/verify-email',
    authRateLimiter(),
    validateBody(verifyOtpSchema),
    authController.verifyEmail.bind(authController)
);

router.post(
    '/resend-otp',
    authRateLimiter(),
    validateBody(resendOtpSchema),
    authController.resendOtp.bind(authController)
);

router.post(
    '/forgot-password',
    authRateLimiter(),
    validateBody(forgotPasswordSchema),
    authController.forgotPassword.bind(authController)
);

router.post(
    '/reset-password',
    authRateLimiter(),
    validateBody(resetPasswordSchema),
    authController.resetPassword.bind(authController)
);

router.post(
    '/refresh-token',
    validateBody(refreshTokenSchema),
    authController.refreshToken.bind(authController)
);

router.post(
    '/logout',
    authController.logout.bind(authController)
);

// Protected routes
router.post(
    '/change-password',
    authMiddleware,
    validateBody(changePasswordSchema),
    authController.changePassword.bind(authController)
);

router.post(
    '/logout-all',
    authMiddleware,
    authController.logoutAll.bind(authController)
);

router.get(
    '/me',
    authMiddleware,
    authController.me.bind(authController)
);

export default router;
