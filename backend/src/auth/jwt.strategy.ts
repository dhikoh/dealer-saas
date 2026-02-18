import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        console.log("STRATEGY JWT_SECRET length:", process.env.JWT_SECRET?.length);

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request) => {
                    const cookies = request?.cookies;
                    const token = cookies?.auth_token;

                    console.log("Incoming cookies:", cookies);
                    console.log("Extracted token:", token?.substring(0, 20));

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
        console.log("Decoded payload:", payload);
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
