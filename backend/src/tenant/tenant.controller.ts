import { Controller, Get, Patch, Post, Put, Delete, Body, Request, Param } from '@nestjs/common';
import { TenantService } from './tenant.service';

// Protected by global JwtAuthGuard
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) { }

  // Get current tenant profile (for logged-in user)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.tenantService.getProfile(req.user.tenantId);
  }

  // Update tenant profile
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() data: { name?: string; address?: string; phone?: string; email?: string }
  ) {
    return this.tenantService.updateProfile(req.user.tenantId, data);
  }

  // Get available plans for upgrade
  @Get('plans')
  async getAvailablePlans(@Request() req: any) {
    return this.tenantService.getAvailablePlans(req.user.tenantId);
  }

  // Request plan upgrade
  @Post('upgrade')
  async requestUpgrade(
    @Request() req: any,
    @Body('planTier') planTier: string
  ) {
    return this.tenantService.requestUpgrade(req.user.tenantId, planTier);
  }

  // Upload payment proof for invoice
  @Post('invoice/:invoiceId/proof')
  async uploadPaymentProof(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string,
    @Body('proofUrl') proofUrl: string
  ) {
    return this.tenantService.uploadPaymentProof(req.user.tenantId, invoiceId, proofUrl);
  }

  // Get tenant's invoices
  @Get('invoices')
  async getInvoices(@Request() req: any) {
    return this.tenantService.getInvoices(req.user.tenantId);
  }

  // ==================== STAFF MANAGEMENT ====================

  // Get all staff
  @Get('staff')
  async getStaff(@Request() req: any) {
    return this.tenantService.getStaff(req.user.tenantId);
  }

  // Create new staff
  @Post('staff')
  async createStaff(
    @Request() req: any,
    @Body() data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      role: string;
      branchId?: string;
    }
  ) {
    return this.tenantService.createStaff(req.user.tenantId, data);
  }

  // Update staff
  @Put('staff/:id')
  async updateStaff(
    @Request() req: any,
    @Param('id') staffId: string,
    @Body() data: {
      name?: string;
      phone?: string;
      role?: string;
      branchId?: string | null;
    }
  ) {
    return this.tenantService.updateStaff(req.user.tenantId, staffId, data);
  }

  // Delete staff
  @Delete('staff/:id')
  async deleteStaff(
    @Request() req: any,
    @Param('id') staffId: string
  ) {
    return this.tenantService.deleteStaff(req.user.tenantId, staffId);
  }

  // Assign staff to branch
  @Patch('staff/:id/branch')
  async assignBranch(
    @Request() req: any,
    @Param('id') staffId: string,
    @Body('branchId') branchId: string | null
  ) {
    return this.tenantService.assignBranch(req.user.tenantId, staffId, branchId);
  }

  // ==================== BRANCH MANAGEMENT ====================

  // Get all branches
  @Get('branches')
  async getBranches(@Request() req: any) {
    return this.tenantService.getBranches(req.user.tenantId);
  }

  // Create new branch
  @Post('branches')
  async createBranch(
    @Request() req: any,
    @Body() data: { name: string; address: string; phone?: string }
  ) {
    return this.tenantService.createBranch(req.user.tenantId, data);
  }

  // Update branch
  @Put('branches/:id')
  async updateBranch(
    @Request() req: any,
    @Param('id') branchId: string,
    @Body() data: { name?: string; address?: string; phone?: string }
  ) {
    return this.tenantService.updateBranch(req.user.tenantId, branchId, data);
  }

  // Delete branch
  @Delete('branches/:id')
  async deleteBranch(
    @Request() req: any,
    @Param('id') branchId: string
  ) {
    return this.tenantService.deleteBranch(req.user.tenantId, branchId);
  }
}
