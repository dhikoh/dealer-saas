import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ALLOW_UNVERIFIED_KEY = 'allowUnverified';
export const ALLOW_UNONBOARDED_KEY = 'allowUnonboarded';

/**
 * UserStateGuard - Enforces user flow completion
 * 
 * This guard checks that the user has completed required flow steps:
 * 1. Email verification (isVerified)
 * 2. Onboarding completion (onboardingCompleted)
 * 
 * Use decorators to bypass for specific routes:
 * - @AllowUnverified() - Allow unverified users (e.g., /auth/verify, /auth/onboarding)
 * - @AllowUnonboarded() - Allow users who haven't completed onboarding
 */
@Injectable()
export class UserStateGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // No user = let JwtAuthGuard handle it
        if (!user) {
            return true;
        }

        // SUPERADMIN bypasses all checks
        if (user.role === 'SUPERADMIN') {
            return true;
        }

        // Check if route allows unverified users
        const allowUnverified = this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Check if route allows unonboarded users
        const allowUnonboarded = this.reflector.getAllAndOverride<boolean>(ALLOW_UNONBOARDED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Enforce email verification
        if (!user.isVerified && !allowUnverified) {
            throw new ForbiddenException({
                statusCode: 403,
                error: 'Email Verification Required',
                message: 'Silakan verifikasi email Anda terlebih dahulu',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        // Enforce onboarding completion
        if (user.isVerified && !user.onboardingCompleted && !allowUnonboarded && !allowUnverified) {
            throw new ForbiddenException({
                statusCode: 403,
                error: 'Onboarding Required',
                message: 'Silakan lengkapi data profil Anda terlebih dahulu',
                code: 'ONBOARDING_NOT_COMPLETED'
            });
        }

        return true;
    }
}
