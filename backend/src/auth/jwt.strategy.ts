import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Custom extractor: tries Authorization header first,
 * then falls back to ?token= query param (for PDF window.open).
 */
function extractJwt(req: Request): string | null {
    const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (fromHeader) return fromHeader;

    // Fallback: read token from query parameter (used by PDF export via window.open)
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
