import { Controller, Get, Patch, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';
import {
  UpdateTenantProfileDto, CreateStaffDto, UpdateStaffDto,
  CreateTenantBranchDto, UpdateTenantBranchDto,
} from './dto/tenant-operations.dto';

// Protected by global JwtAuthGuard
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) { }

  // Get current tenant profile (for logged-in user)
  @Get('profile')
  async getProfile(@ActiveTenant() tenantId: string) {
    return this.tenantService.getProfile(tenantId);
  }

  // Update tenant profile
  @Patch('profile')
  async updateProfile(
    @ActiveTenant() tenantId: string,
    @Body() data: UpdateTenantProfileDto
  ) {
    return this.tenantService.updateProfile(tenantId, data);
  }

  // Get available plans for upgrade
  @Get('plans')
  async getAvailablePlans(@ActiveTenant() tenantId: string) {
    return this.tenantService.getAvailablePlans(tenantId);
  }

  // Request plan upgrade
  @Post('upgrade')
  async requestUpgrade(
    @ActiveTenant() tenantId: string,
    @Body('planTier') planTier: string
  ) {
    return this.tenantService.requestUpgrade(tenantId, planTier);
  }

  // Upload payment proof for invoice
  @Post('invoice/:invoiceId/proof')
  async uploadPaymentProof(
    @ActiveTenant() tenantId: string,
    @Param('invoiceId') invoiceId: string,
    @Body('proofUrl') proofUrl: string
  ) {
    return this.tenantService.uploadPaymentProof(tenantId, invoiceId, proofUrl);
  }

  // Get tenant's invoices
  @Get('invoices')
  async getInvoices(@ActiveTenant() tenantId: string) {
    return this.tenantService.getInvoices(tenantId);
  }

  // ==================== STAFF MANAGEMENT ====================

  // Get all staff
  @Get('staff')
  async getStaff(@ActiveTenant() tenantId: string) {
    return this.tenantService.getStaff(tenantId);
  }

  // Create new staff
  @Post('staff')
  async createStaff(
    @ActiveTenant() tenantId: string,
    @Request() req: any,
    @Body() data: CreateStaffDto
  ) {
    return this.tenantService.createStaff(tenantId, req.user, data);
  }

  // Update staff
  @Put('staff/:id')
  async updateStaff(
    @ActiveTenant() tenantId: string,
    @Request() req: any,
    @Param('id') staffId: string,
    @Body() data: UpdateStaffDto
  ) {
    return this.tenantService.updateStaff(tenantId, staffId, req.user, data);
  }

  // Delete staff
  @Delete('staff/:id')
  async deleteStaff(
    @ActiveTenant() tenantId: string,
    @Param('id') staffId: string
  ) {
    return this.tenantService.deleteStaff(tenantId, staffId);
  }

  // Assign staff to branch
  @Patch('staff/:id/branch')
  async assignBranch(
    @ActiveTenant() tenantId: string,
    @Param('id') staffId: string,
    @Body('branchId') branchId: string | null
  ) {
    return this.tenantService.assignBranch(tenantId, staffId, branchId);
  }

  // ==================== BRANCH MANAGEMENT ====================

  // Get all branches
  @Get('branches')
  async getBranches(@ActiveTenant() tenantId: string) {
    return this.tenantService.getBranches(tenantId);
  }

  // Create new branch
  @Post('branches')
  async createBranch(
    @ActiveTenant() tenantId: string,
    @Body() data: CreateTenantBranchDto
  ) {
    return this.tenantService.createBranch(tenantId, data);
  }

  // Update branch
  @Put('branches/:id')
  async updateBranch(
    @ActiveTenant() tenantId: string,
    @Param('id') branchId: string,
    @Body() data: UpdateTenantBranchDto
  ) {
    return this.tenantService.updateBranch(tenantId, branchId, data);
  }

  // Delete branch
  @Delete('branches/:id')
  async deleteBranch(
    @ActiveTenant() tenantId: string,
    @Param('id') branchId: string
  ) {
    return this.tenantService.deleteBranch(tenantId, branchId);
  }
}
