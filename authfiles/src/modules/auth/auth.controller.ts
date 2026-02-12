import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { authService } from './auth.service.js';
import { OtpType } from '@prisma/client';
import type {
    SignupInput,
    LoginInput,
    VerifyOtpInput,
    ResendOtpInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    RefreshTokenInput,
    ChangePasswordInput,
} from './auth.dto.js';

export class AuthController {
    async signup(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = req.body as SignupInput;
            const result = await authService.signup(input);

            res.status(201).json({
                success: true,
                data: result,
                message: 'Account created successfully. Please verify your email.',
            });
        } catch (error) {
            next(error);
        }
    }

    async login(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = req.body as LoginInput;
            const result = await authService.login(input);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = req.body as VerifyOtpInput;
            const result = await authService.verifyEmail(input);

            res.json({
                success: true,
                data: result,
                message: 'Email verified successfully.',
            });
        } catch (error) {
            next(error);
        }
    }

    async resendOtp(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = req.body as ResendOtpInput;
            const result = await authService.resendOtp(input.email, input.type as OtpType);

            res.json({
                success: true,
                data: result,
                message: 'OTP sent if email exists.',
            });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = req.body as ForgotPasswordInput;
            const result = await authService.forgotPassword(input);

            res.json({
                success: true,
                data: result,
                message: 'Password reset OTP sent if email exists.',
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = req.body as ResetPasswordInput;
            const result = await authService.resetPassword(input);

            res.json({
                success: true,
                data: result,
                message: 'Password reset successfully.',
            });
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input = req.body as RefreshTokenInput;
            const tokens = await authService.refreshTokens(input.refreshToken);

            res.json({
                success: true,
                data: tokens,
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }

            const input = req.body as ChangePasswordInput;
            const result = await authService.changePassword(req.user.id, input);

            res.json({
                success: true,
                data: result,
                message: 'Password changed successfully.',
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { refreshToken } = req.body as { refreshToken: string };
            const result = await authService.logout(refreshToken);

            res.json({
                success: true,
                data: result,
                message: 'Logged out successfully.',
            });
        } catch (error) {
            next(error);
        }
    }

    async logoutAll(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }

            const result = await authService.logoutAll(req.user.id);

            res.json({
                success: true,
                data: result,
                message: 'Logged out from all devices.',
            });
        } catch (error) {
            next(error);
        }
    }

    async me(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            res.json({
                success: true,
                data: {
                    user: req.user,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
export default authController;
