
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus, SuspensionType, Tenant } from '@prisma/client';

export enum AccessLevel {
    FULL = 'FULL',
    READ_ONLY = 'READ_ONLY',
    BILLING_ONLY = 'BILLING_ONLY',
    BLOCK = 'BLOCK',
}

@Injectable()
export class SubscriptionStateService {
    private readonly logger = new Logger(SubscriptionStateService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Safe Transition with Audit Trail
     */
    async transition(
        tenantId: string,
        toStatus: SubscriptionStatus,
        reason?: string,
        triggeredBy: 'SYSTEM' | 'BILLING' | 'SUPERADMIN' = 'SYSTEM',
        referenceId?: string,
        suspensionType: SuspensionType | null = null
    ): Promise<Tenant> {

        return this.prisma.$transaction(async (tx) => {
            // 1. Fetch current status
            const tenant = await tx.tenant.findUnique({
                where: { id: tenantId },
                select: { subscriptionStatus: true, suspensionType: true }
            });

            if (!tenant) throw new BadRequestException('Tenant not found');

            const fromStatus = tenant.subscriptionStatus;

            // 2. Validate Transition
            this.validateTransition(fromStatus, toStatus);

            // 3. Perform Update
            const updatedTenant = await tx.tenant.update({
                where: { id: tenantId },
                data: {
                    subscriptionStatus: toStatus,
                    suspensionType: toStatus === 'SUSPENDED' ? (suspensionType || 'SOFT') : null, // Auto-clear if not suspended? Or keep history? Better clear.
                }
            });

            // 4. Audit Log
            await tx.tenantStatusHistory.create({
                data: {
                    tenantId,
                    oldStatus: fromStatus,
                    newStatus: toStatus,
                    reason,
                    triggeredBy,
                    referenceId
                }
            });

            this.logger.log(`State Transition: ${tenantId} [${fromStatus} -> ${toStatus}] by ${triggeredBy}`);
            return updatedTenant;
        });
    }

    /**
     * Transition Rules Engine
     */
    private validateTransition(from: SubscriptionStatus, to: SubscriptionStatus): void {
        if (from === to) return; // Idempotent OK

        // ALLOWED TRANSITIONS
        const allowed: Partial<Record<SubscriptionStatus, SubscriptionStatus[]>> = {
            ACTIVE: ['GRACE', 'CANCELLED', 'SUSPENDED'], // SUSPENDED allowed for manual admin action
            TRIAL: ['GRACE', 'CANCELLED', 'ACTIVE'], // ACTIVE if upgraded
            GRACE: ['SUSPENDED', 'ACTIVE', 'CANCELLED'],
            SUSPENDED: ['ACTIVE', 'CANCELLED'], // Reactivation or Termination
            CANCELLED: [], // Terminal? Maybe allow Reactivation to ACTIVE if strictly superadmin?
        };

        // TERMINAL CHECK
        if (from === 'CANCELLED') {
            throw new BadRequestException(`Cannot transition from terminal state CANCELLED.`);
        }

        if (!allowed[from]?.includes(to)) {
            throw new BadRequestException(`Illegal state transition: ${from} -> ${to}`);
        }
    }

    /**
     * Resolve Access Level (Deterministic)
     */
    resolveAccess(status: SubscriptionStatus, suspensionType: SuspensionType | null): AccessLevel {
        switch (status) {
            case 'ACTIVE':
            case 'TRIAL':
                return AccessLevel.FULL;

            case 'GRACE':
                return AccessLevel.READ_ONLY;

            case 'SUSPENDED':
                return suspensionType === 'HARD' ? AccessLevel.BLOCK : AccessLevel.BILLING_ONLY;

            case 'CANCELLED':
                return AccessLevel.BLOCK;

            default:
                return AccessLevel.BLOCK;
        }
    }
}
