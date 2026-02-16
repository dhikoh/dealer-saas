import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Custom extractor: tries Authorization header first,
 * then falls back to ?token= query param (for PDF window.open).
 */
function extractJwt(req: Request): string | null {
    // 1. Try Cookie first (Premium Flow)
    if (req.cookies && req.cookies['auth_token']) {
        return req.cookies['auth_token'];
    }

    // 2. Try Authorization Header
    const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (fromHeader) return fromHeader;

    // NOTE: Query param tokens (?token=) intentionally removed.
    // Tokens in URLs leak to server logs, browser history, and Referer headers.
    // For PDF exports, use a dedicated short-lived token endpoint instead.

    return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: extractJwt,
            ignoreExpiration: false,
            secretOrKey: (() => {
                const secret = process.env.JWT_SECRET;
                if (!secret) throw new Error('FATAL: JWT_SECRET environment variable is not set');
                return secret;
            })(),
        });
    }

    async validate(payload: any) {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId,
            isVerified: payload.isVerified,
            onboardingCompleted: payload.onboardingCompleted,
        };
    }
}
