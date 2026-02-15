import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanById } from '../config/plan-tiers.config';

@Injectable()
export class CustomerService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string, search?: string) {
        return this.prisma.customer.findMany({
            where: {
                tenantId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { name: { contains: search } },
                        { phone: { contains: search } },
                        { email: { contains: search } },
                    ],
                }),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                transactions: {
                    include: { vehicle: true },
                    take: 5,
                },
            },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.customer.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                transactions: {
                    include: { vehicle: true, credit: true },
                },
            },
        });
    }

    async create(tenantId: string, data: any) {
        // Check plan limit
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                _count: { select: { customers: true } },
                plan: true
            },
        });

        if (tenant) {
            let limit = 0;
            let planName = '';

            if (tenant.plan) {
                // maxCustomers is in features JSON, not a column
                limit = (tenant.plan.features as any)?.maxCustomers ?? 0;
                planName = tenant.plan.name;
            } else {
                const legacyPlan = getPlanById(tenant.planTier);
                limit = legacyPlan?.features.maxCustomers ?? 0;
                planName = legacyPlan?.name || 'Unknown';
            }

            if (limit !== -1 && tenant._count.customers >= limit) {
                throw new BadRequestException(
                    `Batas customer tercapai (${limit} customer pada paket ${planName}). Upgrade plan untuk menambah lebih banyak.`
                );
            }
        }

        // SECURITY: Strip dangerous fields before create
        const safeData = { ...data };
        delete safeData.id;
        delete safeData.tenantId;
        delete safeData.createdAt;
        delete safeData.updatedAt;

        return this.prisma.customer.create({
            data: { ...safeData, tenantId },
        });
    }

    async update(id: string, tenantId: string, data: any) {
        // SECURITY: Verify ownership before update
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId },
        });
        if (!customer) {
            throw new NotFoundException('Customer tidak ditemukan');
        }
        // SECURITY: Strip dangerous fields before update
        const safeData = { ...data };
        delete safeData.id;
        delete safeData.tenantId;
        delete safeData.createdAt;
        delete safeData.updatedAt;

        return this.prisma.customer.update({
            where: { id },
            data: safeData,
        });
    }

    async delete(id: string, tenantId: string) {
        // SECURITY: Verify ownership before delete
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!customer) {
            throw new NotFoundException('Customer tidak ditemukan');
        }
        // Soft delete: set deletedAt timestamp
        return this.prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // Get document completion status
    async getDocumentStatus(id: string, tenantId: string) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId },
        });

        if (!customer) return null;

        return {
            ktp: { required: true, completed: !!customer.ktpImage },
            kk: { required: false, completed: !!customer.kkImage },
            homeProof: { required: false, completed: !!customer.homeProofImage },
            salarySlip: { required: false, completed: !!customer.salarySlipImage },
            bankStatement: { required: false, completed: !!customer.bankStatementImage },
            businessLicense: { required: false, completed: !!customer.businessLicenseImage },
        };
    }


    // Generate PDF
    async generatePdf(id: string, tenantId: string): Promise<Buffer> {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId },
            include: { tenant: true },
        });

        if (!customer) {
            throw new NotFoundException('Customer tidak ditemukan');
        }

        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', (buffer) => buffers.push(buffer));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            // -- HEADER --
            doc.fontSize(20).text('DATA CUSTOMER', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Dealer: ${customer.tenant.name}`, { align: 'center' });
            doc.moveDown(2);

            // -- INFO TABLE --
            const startX = 50;
            let currentY = doc.y;
            const labelWidth = 120;
            const valueWidth = 300;

            const drawRow = (label: string, value: string | null | undefined) => {
                doc.font('Helvetica-Bold').text(label, startX, currentY);
                doc.font('Helvetica').text(value || '-', startX + labelWidth, currentY);
                currentY += 20;
            };

            drawRow('Nama Lengkap', customer.name);
            drawRow('No. Telp', customer.phone);
            drawRow('Email', customer.email);
            drawRow('No. KTP', customer.ktpNumber);
            drawRow('Alamat', customer.address);
            drawRow('Tgl. Terdaftar', customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('id-ID') : '-');

            doc.moveDown(2);
            currentY = doc.y;

            // -- KTP IMAGE --
            if (customer.ktpImage) {
                try {
                    let imagePath = customer.ktpImage;
                    if (imagePath.startsWith('/')) imagePath = imagePath.substring(1);

                    const fullPath = path.join(process.cwd(), imagePath);

                    if (fs.existsSync(fullPath)) {
                        doc.font('Helvetica-Bold').text('FOTO KTP:', startX, currentY);
                        currentY += 20;
                        doc.image(fullPath, startX, currentY, { width: 400 });
                    } else {
                        doc.text('(File foto KTP tidak ditemukan di server)', startX, currentY);
                    }
                } catch (e) {
                    doc.text('(Gagal memuat foto KTP)', startX, currentY);
                    console.error('PDF Image Error:', e);
                }
            } else {
                doc.text('(Belum ada foto KTP)', startX, currentY);
            }

            // -- FOOTER --
            const bottomY = doc.page.height - 50;
            doc.font('Helvetica').fontSize(8).text(
                `Generated by OTOHUB on ${new Date().toLocaleString('id-ID')}`,
                50,
                bottomY,
                { align: 'center', width: 500 }
            );

            doc.end();
        });
    }
}
