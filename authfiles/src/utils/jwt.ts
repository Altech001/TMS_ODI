import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export interface TokenPayload {
    userId: string;
    email: string;
    type: 'access' | 'refresh';
}

export interface DecodedToken extends TokenPayload {
    iat: number;
    exp: number;
}

function parseExpiryToSeconds(expiry: string): number {
    const units: Record<string, number> = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // default 1 hour
    const [, value, unit] = match;
    return parseInt(value, 10) * units[unit];
}

export function generateAccessToken(userId: string, email: string): string {
    const payload: TokenPayload = {
        userId,
        email,
        type: 'access',
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: parseExpiryToSeconds(config.jwt.accessExpiry),
    });
}

export function generateRefreshToken(userId: string, email: string): string {
    const payload: TokenPayload = {
        userId,
        email,
        type: 'refresh',
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: parseExpiryToSeconds(config.jwt.refreshExpiry),
    });
}

export function verifyAccessToken(token: string): DecodedToken | null {
    try {
        return jwt.verify(token, config.jwt.secret) as DecodedToken;
    } catch {
        return null;
    }
}

export function verifyRefreshToken(token: string): DecodedToken | null {
    try {
        return jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
    } catch {
        return null;
    }
}

export function getTokenExpiry(expiresIn: string): Date {
    const units: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error(`Invalid expiry format: ${expiresIn}`);
    }

    const [, value, unit] = match;
    const ms = parseInt(value, 10) * units[unit];
    return new Date(Date.now() + ms);
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
}

export default {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getTokenExpiry,
    extractTokenFromHeader,
};
