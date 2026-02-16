import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Transaction, Vehicle, Customer, User, Credit, TransactionPayment, Tenant } from '@prisma/client';

export type DetailedTransaction = Transaction & {
    vehicle: Vehicle;
    customer: Customer;
    salesPerson: User; // User model
    credit?: Credit | null;
    payments: TransactionPayment[];
    tenant: Tenant;
};

@Injectable()
export class TransactionDal {
    constructor(private prisma: PrismaService) { }

    /**
     * Get transaction with all relations needed for PDF generation (Invoice, SPK, etc.)
     */
    async getDetailedTransaction(id: string, tenantId: string): Promise<DetailedTransaction> {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId },
            include: {
                vehicle: true,
                customer: true,
                salesPerson: true,
                credit: {
                    include: {
                        payments: true, // If we need credit payments details
                    }
                },
                payments: true,
                tenant: true, // Include tenant for header info
            },
        });

        if (!transaction) {
            throw new NotFoundException('Data Transaksi tidak ditemukan');
        }

        return transaction as DetailedTransaction;
    }

    /**
     * Alias for getDetailedTransaction, specifically for "Sales Draft" / Quotation context.
     * In the future, this can be filtered by status if needed.
     */
    async getDetailedSalesDraft(id: string, tenantId: string): Promise<DetailedTransaction> {
        // reuse the same logic for now
        return this.getDetailedTransaction(id, tenantId);
    }
}
