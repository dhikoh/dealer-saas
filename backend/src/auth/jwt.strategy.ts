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
        console.log('[JWT Strategy] Found auth_token in cookie');
        return req.cookies['auth_token'];
    }
    console.log('[JWT Strategy] No auth_token in cookie. Cookies:', req.cookies);

    // 2. Try Authorization Header
    const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (fromHeader) return fromHeader;

    // 3. Fallback: Query Parameter (PDF export, etc.)
    const queryToken = req.query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
        return queryToken;
    }

    return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: extractJwt,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super-secret-key',
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
