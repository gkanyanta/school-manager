import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { PaymentMethod, InvoiceStatus } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ─── FEE STRUCTURES ─────────────────────────────

  async createFeeStructure(
    data: { gradeId: string; termId: string; items: { name: string; amount: number; isOptional?: boolean }[] },
    schoolId: string,
    userId: string,
  ) {
    const [grade, term] = await Promise.all([
      this.prisma.grade.findFirst({ where: { id: data.gradeId, schoolId } }),
      this.prisma.term.findFirst({ where: { id: data.termId, schoolId } }),
    ]);
    if (!grade) throw new BadRequestException('Grade not found');
    if (!term) throw new BadRequestException('Term not found');

    const existing = await this.prisma.feeStructure.findFirst({
      where: { gradeId: data.gradeId, termId: data.termId, schoolId },
    });
    if (existing) throw new BadRequestException('Fee structure already exists for this grade/term');

    const structure = await this.prisma.feeStructure.create({
      data: {
        gradeId: data.gradeId,
        termId: data.termId,
        schoolId,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            amount: item.amount,
            isOptional: item.isOptional || false,
          })),
        },
      },
      include: { items: true, grade: true, term: true },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE_FEE_STRUCTURE',
      entity: 'FeeStructure',
      entityId: structure.id,
      schoolId,
    });

    return structure;
  }

  async getFeeStructures(schoolId: string, gradeId?: string, termId?: string) {
    const where: any = { schoolId };
    if (gradeId) where.gradeId = gradeId;
    if (termId) where.termId = termId;

    return this.prisma.feeStructure.findMany({
      where,
      include: { items: true, grade: true, term: true },
    });
  }

  // ─── INVOICES ────────────────────────────────────

  async generateInvoice(studentId: string, termId: string, schoolId: string, userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: { include: { grade: true } } },
    });
    if (!student) throw new NotFoundException('Student not found');

    const structure = await this.prisma.feeStructure.findFirst({
      where: { gradeId: student.class.gradeId, termId, schoolId },
      include: { items: true },
    });
    if (!structure) throw new BadRequestException('No fee structure found for this grade/term');

    // Check existing invoice
    const existing = await this.prisma.invoice.findFirst({
      where: { studentId, termId, schoolId, status: { not: 'CANCELLED' } },
    });
    if (existing) throw new BadRequestException('Invoice already exists for this student/term');

    const totalAmount = structure.items
      .filter((i) => !i.isOptional)
      .reduce((sum, i) => sum + i.amount, 0);

    // Generate invoice number with school prefix
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    const count = await this.prisma.invoice.count({ where: { schoolId } });
    const number = `${school!.code}-INV-${String(count + 1).padStart(6, '0')}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        number,
        totalAmount,
        studentId,
        termId,
        schoolId,
        status: 'SENT',
        lines: {
          create: structure.items
            .filter((i) => !i.isOptional)
            .map((i) => ({ name: i.name, amount: i.amount })),
        },
      },
      include: { lines: true, student: true, term: true },
    });

    await this.auditService.log({
      userId,
      action: 'GENERATE_INVOICE',
      entity: 'Invoice',
      entityId: invoice.id,
      schoolId,
    });

    return invoice;
  }

  async generateBulkInvoices(classId: string, termId: string, schoolId: string, userId: string) {
    const students = await this.prisma.student.findMany({
      where: { classId, schoolId, status: 'ACTIVE' },
    });

    const results = { generated: 0, skipped: 0, errors: [] as string[] };

    for (const student of students) {
      try {
        await this.generateInvoice(student.id, termId, schoolId, userId);
        results.generated++;
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          results.skipped++;
        } else {
          results.errors.push(`${student.admissionNumber}: ${err.message}`);
        }
      }
    }

    return results;
  }

  async getInvoices(schoolId: string, page = 1, limit = 20, studentId?: string, termId?: string, status?: InvoiceStatus) {
    const where: any = { schoolId };
    if (studentId) where.studentId = studentId;
    if (termId) where.termId = termId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          term: true,
          lines: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInvoiceById(id: string, schoolId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, schoolId },
      include: {
        student: { include: { class: { include: { grade: true } }, guardianLinks: { include: { guardian: true } } } },
        term: { include: { academicYear: true } },
        lines: true,
        payments: { include: { receipt: true } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  // ─── PAYMENTS ────────────────────────────────────

  async recordPayment(
    data: { invoiceId: string; amount: number; method: PaymentMethod; reference?: string; notes?: string; paidDate: string | Date },
    userId: string,
    schoolId: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: data.invoiceId, schoolId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const remainingBalance = invoice.totalAmount - invoice.paidAmount;
    if (data.amount > remainingBalance) {
      throw new BadRequestException(`Payment amount (${data.amount}) exceeds balance (${remainingBalance})`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          method: data.method,
          reference: data.reference,
          notes: data.notes,
          paidDate: new Date(data.paidDate),
          invoiceId: data.invoiceId,
          receivedBy: userId,
          schoolId,
        },
      });

      // Generate receipt with transaction-safe counter
      const school = await tx.school.update({
        where: { id: schoolId },
        data: { receiptCounter: { increment: 1 } },
      });

      const receiptNumber = `${school.code}-RCT-${String(school.receiptCounter).padStart(6, '0')}`;

      const receipt = await tx.receipt.create({
        data: {
          number: receiptNumber,
          paymentId: payment.id,
          schoolId,
        },
      });

      // Update invoice
      const newPaidAmount = invoice.paidAmount + data.amount;
      const newStatus: InvoiceStatus =
        newPaidAmount >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });

      return { payment, receipt };
    });

    await this.auditService.log({
      userId,
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: result.payment.id,
      after: { amount: data.amount, method: data.method, receiptNumber: result.receipt.number } as any,
      schoolId,
    });

    return result;
  }

  async getPayments(schoolId: string, invoiceId?: string) {
    const where: any = { schoolId };
    if (invoiceId) where.invoiceId = invoiceId;

    return this.prisma.payment.findMany({
      where,
      include: {
        receipt: true,
        invoice: {
          include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } } },
        },
        receiver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentStatement(studentId: string, schoolId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { studentId, schoolId },
      include: {
        lines: true,
        payments: { include: { receipt: true }, orderBy: { paidDate: 'asc' } },
        term: { include: { academicYear: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalFees = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const balance = totalFees - totalPaid;

    return { invoices, summary: { totalFees, totalPaid, balance } };
  }

  // ─── BURSAR DASHBOARD ───────────────────────────

  async getBursarDashboard(schoolId: string, termId?: string) {
    const where: any = { schoolId };
    if (termId) where.termId = termId;

    const invoices = await this.prisma.invoice.findMany({ where });

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalArrears = totalBilled - totalCollected;
    const paidCount = invoices.filter((i) => i.status === 'PAID').length;
    const partialCount = invoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
    const unpaidCount = invoices.filter((i) => i.status === 'SENT' || i.status === 'OVERDUE').length;

    // Top debtors
    const debtors = invoices
      .filter((i) => i.totalAmount > i.paidAmount)
      .map((i) => ({ invoiceId: i.id, studentId: i.studentId, balance: i.totalAmount - i.paidAmount }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    const topDebtors = await Promise.all(
      debtors.map(async (d) => {
        const student = await this.prisma.student.findUnique({
          where: { id: d.studentId },
          select: { firstName: true, lastName: true, admissionNumber: true },
        });
        return { ...d, student };
      }),
    );

    return {
      totalBilled,
      totalCollected,
      totalArrears,
      invoiceCount: invoices.length,
      paidCount,
      partialCount,
      unpaidCount,
      collectionRate: invoices.length > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0',
      topDebtors,
    };
  }
}
