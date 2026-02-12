import { OtpType } from '@prisma/client';
import { authRepository } from './auth.repository.js';
import { organizationService } from '../organization/organization.service.js';
import { organizationRepository } from '../organization/organization.repository.js';
import { notificationService } from '../notification/notification.service.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateAccessToken, getTokenExpiry } from '../../utils/jwt.js';
import { generateOtp, getOtpExpiry, generateSecureToken } from '../../utils/otp.js';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../../utils/errors.js';
import { emailQueue } from '../../queues/index.js';
import config from '../../config/index.js';
import type {
    SignupInput,
    LoginInput,
    VerifyOtpInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    ChangePasswordInput,
} from './auth.dto.js';

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

interface UserResponse {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
    createdAt: Date;
}

export class AuthService {
    async signup(input: SignupInput): Promise<{ user: UserResponse; tokens: AuthTokens; organizationId: string }> {
        
        // 1. Verify Invite Token (if present)
        // We do this first to fail fast if the token is invalid
        let validInvite = null;
        if (input.inviteToken) {
            validInvite = await organizationRepository.findInviteByToken(input.inviteToken);
            
            // Ensure invite exists and email matches
            if (!validInvite || validInvite.email.toLowerCase() !== input.email.toLowerCase()) {
                throw new BadRequestError('Invalid invite token for this email address');
            }
            if (validInvite.status !== 'PENDING') {
                throw new BadRequestError('Invite has already been used or expired');
            }
            if (validInvite.expiresAt < new Date()) {
                throw new BadRequestError('Invite has expired');
            }
        }

        // 2. Check if user already exists
        const existingUser = await authRepository.findUserByEmail(input.email);
        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // 3. Hash password
        const passwordHash = await hashPassword(input.password);

        // 4. Create user
        // Note: If signing up via invite, we consider email verified (trusted source)
        const user = await authRepository.createUser({
            email: input.email,
            passwordHash,
            name: input.name,
        });

        // 5. Handle Organization Association
        let primaryOrgId: string;

        if (validInvite) {
            // SCENARIO A: Joining via Invite
            // Add user to the organization immediately
            await organizationRepository.addMember(
                validInvite.organizationId,
                user.id,
                validInvite.role
            );

            // Mark invite as accepted
            await organizationRepository.updateInviteStatus(validInvite.id, 'ACCEPTED');

            // Auto-verify email since they came from a valid email link
            await authRepository.updateUser(user.id, { isEmailVerified: true });

            primaryOrgId = validInvite.organizationId;

            // Notify inviter
            await notificationService.create({
                userId: validInvite.invitedById,
                organizationId: validInvite.organizationId,
                type: 'INVITE_ACCEPTED',
                title: 'Invite Accepted',
                message: `${user.name} joined via your invitation`,
                data: { userId: user.id }
            });

        } else {
            // SCENARIO B: Standard Signup
            // Create default organization
            const orgName = input.organizationName || `${input.name}'s Workspace`;
            const organization = await organizationService.createOrganization(
                { name: orgName },
                user.id
            );
            primaryOrgId = organization.id;

            // Standard Verification Flow
            // Generate OTP for email verification
            const otp = generateOtp();
            await authRepository.createOtp({
                email: user.email,
                code: otp,
                type: OtpType.EMAIL_VERIFICATION,
                expiresAt: getOtpExpiry(),
            });

            // Queue email
            await emailQueue.add('send-otp', {
                email: user.email,
                otp,
                type: 'verification',
            });
        }

        // 6. Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        // Refetch user to get updated verification status if changed
        const finalUser = validInvite 
            ? { ...user, isEmailVerified: true } 
            : user;

        return {
            user: {
                id: finalUser.id,
                email: finalUser.email,
                name: finalUser.name,
                isEmailVerified: finalUser.isEmailVerified ?? false,
                createdAt: finalUser.createdAt,
            },
            tokens,
            organizationId: primaryOrgId,
        };
    }

    async login(input: LoginInput): Promise<{ user: UserResponse; tokens: AuthTokens; organizations: { id: string; name: string; role: string }[] }> {
        const user = await authRepository.findUserByEmail(input.email);
        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const isValidPassword = await comparePassword(input.password, user.passwordHash);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Get user's organizations
        const organizations = await organizationService.getUserOrganizations(user.id);

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
            },
            tokens,
            organizations: organizations.map((m) => ({
                id: m.organization.id,
                name: m.organization.name,
                role: m.role,
            })),
        };
    }

    async verifyEmail(input: VerifyOtpInput): Promise<{ success: boolean }> {
        const otp = await authRepository.findValidOtp(input.email, input.code, OtpType.EMAIL_VERIFICATION);
        if (!otp) {
            throw new BadRequestError('Invalid or expired OTP');
        }

        const user = await authRepository.findUserByEmail(input.email);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Mark OTP as used
        await authRepository.markOtpAsUsed(otp.id);

        // Update user
        await authRepository.updateUser(user.id, { isEmailVerified: true });

        return { success: true };
    }

    async resendOtp(email: string, type: OtpType): Promise<{ success: boolean }> {
        const user = await authRepository.findUserByEmail(email);
        if (!user) {
            // Don't reveal if user exists
            return { success: true };
        }

        if (type === OtpType.EMAIL_VERIFICATION && user.isEmailVerified) {
            throw new BadRequestError('Email already verified');
        }

        const otp = generateOtp();
        await authRepository.createOtp({
            email: user.email,
            code: otp,
            type,
            expiresAt: getOtpExpiry(),
        });

        await emailQueue.add('send-otp', {
            email: user.email,
            otp,
            type: type === OtpType.EMAIL_VERIFICATION ? 'verification' : 'reset',
        });

        return { success: true };
    }

    async forgotPassword(input: ForgotPasswordInput): Promise<{ success: boolean }> {
        return this.resendOtp(input.email, OtpType.PASSWORD_RESET);
    }

    async resetPassword(input: ResetPasswordInput): Promise<{ success: boolean }> {
        const otp = await authRepository.findValidOtp(input.email, input.code, OtpType.PASSWORD_RESET);
        if (!otp) {
            throw new BadRequestError('Invalid or expired OTP');
        }

        const user = await authRepository.findUserByEmail(input.email);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Mark OTP as used
        await authRepository.markOtpAsUsed(otp.id);

        // Hash new password
        const passwordHash = await hashPassword(input.newPassword);

        // Update user
        await authRepository.updateUser(user.id, { passwordHash });

        // Revoke all refresh tokens
        await authRepository.revokeAllUserRefreshTokens(user.id);

        return { success: true };
    }

    async changePassword(userId: string, input: ChangePasswordInput): Promise<{ success: boolean }> {
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isValidPassword = await comparePassword(input.currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new BadRequestError('Current password is incorrect');
        }

        const passwordHash = await hashPassword(input.newPassword);
        await authRepository.updateUser(user.id, { passwordHash });

        // Revoke all refresh tokens except current session
        await authRepository.revokeAllUserRefreshTokens(user.id);

        return { success: true };
    }

    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        // Find token in database
        const storedToken = await authRepository.findRefreshToken(refreshToken);
        if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('Refresh token expired or revoked');
        }

        // Revoke old token (rotation)
        await authRepository.revokeRefreshToken(refreshToken);

        // Generate new tokens
        return this.generateTokens(storedToken.userId, storedToken.user.email);
    }

    async logout(refreshToken: string): Promise<{ success: boolean }> {
        try {
            await authRepository.revokeRefreshToken(refreshToken);
        } catch {
            // Token might not exist, that's okay
        }
        return { success: true };
    }

    async logoutAll(userId: string): Promise<{ success: boolean }> {
        await authRepository.revokeAllUserRefreshTokens(userId);
        return { success: true };
    }

    private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
        const accessToken = generateAccessToken(userId, email);
        const refreshTokenValue = generateSecureToken(64);
        const expiresAt = getTokenExpiry(config.jwt.refreshExpiry);

        await authRepository.createRefreshToken({
            userId,
            token: refreshTokenValue,
            expiresAt,
        });

        return {
            accessToken,
            refreshToken: refreshTokenValue,
            expiresIn: config.jwt.accessExpiry,
        };
    }
}

export const authService = new AuthService();
export default authService;