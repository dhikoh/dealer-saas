import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const secret = process.env.JWT_SECRET;
        console.log('[JwtStrategy] Initialized with Secret Length:', secret ? secret.length : 'UNDEFINED');

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request) => {
                    const cookies = request?.cookies;
                    const token = cookies?.auth_token;

                    console.log('[JwtStrategy] Extractor - Cookies:', cookies ? Object.keys(cookies) : 'None');
                    console.log('[JwtStrategy] Extractor - auth_token found:', !!token);

                    if (token) console.log('[JwtStrategy] Token Preview:', token.substring(0, 15) + '...');

                    return token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: (() => {
                const secret = process.env.JWT_SECRET;
                if (!secret) throw new Error('FATAL: JWT_SECRET environment variable is not set');
                return secret;
            })(),
        });
    }

    async validate(payload: any) {
        console.log('[JwtStrategy] Validating payload:', payload);
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
