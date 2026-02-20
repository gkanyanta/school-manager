import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { FeesService } from './fees.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, InvoiceStatus } from '@prisma/client';

@ApiTags('Fees')
@ApiBearerAuth()
@Controller('fees')
export class FeesController {
  constructor(private feesService: FeesService) {}

  // ─── FEE STRUCTURES ─────────────────────────────

  @Post('structures')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR)
  @ApiOperation({ summary: 'Create fee structure' })
  async createStructure(@Body() dto: any, @CurrentUser() user: any) {
    const structure = await this.feesService.createFeeStructure(dto, user.schoolId, user.id);
    return { success: true, data: structure };
  }

  @Get('structures')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'List fee structures' })
  async getStructures(
    @CurrentUser('schoolId') schoolId: string,
    @Query('gradeId') gradeId?: string,
    @Query('termId') termId?: string,
  ) {
    const structures = await this.feesService.getFeeStructures(schoolId, gradeId, termId);
    return { success: true, data: structures };
  }

  // ─── INVOICES ────────────────────────────────────

  @Post('invoices/generate')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR)
  @ApiOperation({ summary: 'Generate invoice for a student' })
  async generateInvoice(@Body() dto: { studentId: string; termId: string }, @CurrentUser() user: any) {
    const invoice = await this.feesService.generateInvoice(dto.studentId, dto.termId, user.schoolId, user.id);
    return { success: true, data: invoice };
  }

  @Post('invoices/generate-bulk')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR)
  @ApiOperation({ summary: 'Generate invoices for all students in a class' })
  async generateBulkInvoices(@Body() dto: { classId: string; termId: string }, @CurrentUser() user: any) {
    const result = await this.feesService.generateBulkInvoices(dto.classId, dto.termId, user.schoolId, user.id);
    return { success: true, data: result };
  }

  @Get('invoices')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'List invoices' })
  async getInvoices(
    @CurrentUser('schoolId') schoolId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('studentId') studentId?: string,
    @Query('termId') termId?: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    const result = await this.feesService.getInvoices(
      schoolId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      studentId,
      termId,
      status,
    );
    return { success: true, ...result };
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoiceById(@Param('id') id: string, @CurrentUser('schoolId') schoolId: string) {
    const invoice = await this.feesService.getInvoiceById(id, schoolId);
    return { success: true, data: invoice };
  }

  // ─── PAYMENTS ────────────────────────────────────

  @Post('payments')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR)
  @ApiOperation({ summary: 'Record a payment' })
  async recordPayment(@Body() dto: any, @CurrentUser() user: any) {
    const result = await this.feesService.recordPayment(dto, user.id, user.schoolId);
    return { success: true, data: result };
  }

  @Get('payments')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR)
  @ApiOperation({ summary: 'List payments' })
  async getPayments(
    @CurrentUser('schoolId') schoolId: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    const payments = await this.feesService.getPayments(schoolId, invoiceId);
    return { success: true, data: payments };
  }

  // ─── STATEMENTS ──────────────────────────────────

  @Get('statements/student/:studentId')
  @ApiOperation({ summary: 'Get student fee statement' })
  async getStatement(
    @Param('studentId') studentId: string,
    @CurrentUser('schoolId') schoolId: string,
  ) {
    const statement = await this.feesService.getStudentStatement(studentId, schoolId);
    return { success: true, data: statement };
  }

  @Get('statements/student/:studentId/export')
  @ApiOperation({ summary: 'Export student fee statement as CSV' })
  async exportStatement(
    @Param('studentId') studentId: string,
    @CurrentUser('schoolId') schoolId: string,
    @Res() res: Response,
  ) {
    const statement = await this.feesService.getStudentStatement(studentId, schoolId);
    const rows = statement.invoices.flatMap((inv) => [
      ...inv.lines.map((l) => ({ type: 'CHARGE', term: inv.term.name, description: l.name, amount: l.amount, date: inv.createdAt })),
      ...inv.payments.map((p) => ({ type: 'PAYMENT', term: inv.term.name, description: `Payment - ${p.method}`, amount: -p.amount, date: p.paidDate })),
    ]);

    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fee-statement.csv');
    res.send(csv);
  }

  // ─── DASHBOARD ───────────────────────────────────

  @Get('dashboard')
  @Roles(Role.SCHOOL_ADMIN, Role.BURSAR, Role.HEAD_TEACHER)
  @ApiOperation({ summary: 'Get bursar dashboard' })
  async getDashboard(
    @CurrentUser('schoolId') schoolId: string,
    @Query('termId') termId?: string,
  ) {
    const dashboard = await this.feesService.getBursarDashboard(schoolId, termId);
    return { success: true, data: dashboard };
  }
}
