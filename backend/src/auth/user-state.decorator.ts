import { SetMetadata } from '@nestjs/common';
import { ALLOW_UNVERIFIED_KEY, ALLOW_UNONBOARDED_KEY } from './user-state.guard';

/**
 * Allow unverified users to access this route
 * Use for: OTP verification, resend OTP, onboarding
 */
export const AllowUnverified = () => SetMetadata(ALLOW_UNVERIFIED_KEY, true);

/**
 * Allow users who haven't completed onboarding
 * Use for: Onboarding endpoint only
 */
export const AllowUnonboarded = () => SetMetadata(ALLOW_UNONBOARDED_KEY, true);
