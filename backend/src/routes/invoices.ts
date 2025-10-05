import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin, requireClinicalStaff } from './auth';
import { setAuditData } from '../middleware/auditLogger';
import { AuditAction } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Get all invoices
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('clientType').optional().isIn(['B2B', 'B2B2C']).withMessage('Invalid client type'),
    query('status').optional().isIn(['EMITIDA', 'ENVIADA', 'PAGADA', 'CANCELADA', 'ABONADA']).withMessage('Invalid status'),
    query('paymentMethod').optional().isIn(['INTERNAL', 'STRIPE']).withMessage('Invalid payment method'),
    query('isCreditNote').optional().isBoolean().withMessage('Is credit note must be a boolean'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      clientType,
      status,
      paymentMethod,
      isCreditNote,
      startDate,
      endDate,
      sortBy = 'invoiceDate',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { concept: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (clientType) {
      where.clientType = clientType;
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (isCreditNote !== undefined) {
      where.isCreditNote = isCreditNote;
    }

    if (startDate) {
      where.invoiceDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.invoiceDate = { lte: new Date(endDate) };
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceSeries: true,
          invoiceYear: true,
          invoiceDate: true,
          billingIds: true,
          clientType: true,
          clientName: true,
          clientCifDni: true,
          clientAddress: true,
          clientEmail: true,
          concept: true,
          subtotal: true,
          vatRate: true,
          vatAmount: true,
          totalAmount: true,
          paymentDetails: true,
          status: true,
          pdfUrl: true,
          isCreditNote: true,
          originalInvoiceId: true,
          rectifyingInvoiceId: true,
          paymentMethod: true,
          stripeInvoiceId: true,
          stripeCustomerId: true,
          stripeHostedInvoiceUrl: true,
          stripeInvoicePdfUrl: true,
          createdAt: true,
          updatedAt: true,
          subscriptionBillings: {
            select: {
              id: true,
              billingPeriod: true,
              numberOfStudents: true,
              totalAmount: true,
              status: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Invoice', undefined, {
      filters: { search, clientType, status, paymentMethod, isCreditNote, startDate, endDate },
      pagination: { page, limit, total },
    });

    return res.json({
      success: true,
      data: invoices,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get invoice by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Invoice ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceSeries: true,
        invoiceYear: true,
        invoiceDate: true,
        billingIds: true,
        clientType: true,
        clientName: true,
        clientCifDni: true,
        clientAddress: true,
        clientEmail: true,
        concept: true,
        subtotal: true,
        vatRate: true,
        vatAmount: true,
        totalAmount: true,
        paymentDetails: true,
        status: true,
        pdfUrl: true,
        isCreditNote: true,
        originalInvoiceId: true,
        rectifyingInvoiceId: true,
        paymentMethod: true,
        stripeInvoiceId: true,
        stripeCustomerId: true,
        stripeHostedInvoiceUrl: true,
        stripeInvoicePdfUrl: true,
        createdAt: true,
        updatedAt: true,
        subscriptionBillings: {
          select: {
            id: true,
            billingPeriod: true,
            numberOfStudents: true,
            totalAmount: true,
            status: true,
            subscriptionConfig: {
              select: {
                id: true,
                name: true,
                paymentType: true,
                center: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw notFoundErrorHandler('Invoice');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Invoice', id);

    return res.json({
      success: true,
      data: invoice,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create invoice
router.post('/',
  requireClinicalStaff,
  [
    body('billingIds').isArray().isLength({ min: 1 }).withMessage('Billing IDs array is required'),
    body('clientType').isIn(['B2B', 'B2B2C']).withMessage('Valid client type is required'),
    body('clientName').isString().isLength({ min: 1 }).withMessage('Client name is required'),
    body('clientCifDni').isString().isLength({ min: 1 }).withMessage('Client CIF/DNI is required'),
    body('clientAddress').isString().isLength({ min: 1 }).withMessage('Client address is required'),
    body('clientEmail').isEmail().withMessage('Valid client email is required'),
    body('concept').isString().isLength({ min: 1 }).withMessage('Concept is required'),
    body('subtotal').isNumeric().withMessage('Subtotal is required'),
    body('vatRate').isNumeric().withMessage('VAT rate is required'),
    body('vatAmount').isNumeric().withMessage('VAT amount is required'),
    body('totalAmount').isNumeric().withMessage('Total amount is required'),
    body('paymentDetails').isArray().withMessage('Payment details array is required'),
    body('paymentMethod').optional().isIn(['INTERNAL', 'STRIPE']).withMessage('Invalid payment method'),
    body('isCreditNote').optional().isBoolean().withMessage('Is credit note must be a boolean'),
    body('originalInvoiceId').optional().isString().withMessage('Original invoice ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const invoiceData = req.body;

    // Check if all billing IDs exist
    const billings = await prisma.subscriptionBilling.findMany({
      where: { id: { in: invoiceData.billingIds } },
      select: { id: true, status: true },
    });

    if (billings.length !== invoiceData.billingIds.length) {
      throw validationErrorHandler('Some billing IDs do not exist');
    }

    // Check if billings are not already invoiced
    const alreadyInvoiced = billings.filter(billing => billing.status === 'FACTURADO');
    if (alreadyInvoiced.length > 0) {
      throw validationErrorHandler('Some billings are already invoiced');
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceYear: new Date().getFullYear() },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(/[^\d]/g, ''));
      nextNumber = lastNumber + 1;
    }

    const invoiceNumber = `FAC-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        invoiceNumber,
        invoiceSeries: 'FAC',
        invoiceYear: new Date().getFullYear(),
        invoiceDate: new Date(),
        status: 'EMITIDA',
        paymentMethod: invoiceData.paymentMethod || 'INTERNAL',
        isCreditNote: invoiceData.isCreditNote || false,
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceSeries: true,
        invoiceYear: true,
        invoiceDate: true,
        billingIds: true,
        clientType: true,
        clientName: true,
        clientCifDni: true,
        clientAddress: true,
        clientEmail: true,
        concept: true,
        subtotal: true,
        vatRate: true,
        vatAmount: true,
        totalAmount: true,
        paymentDetails: true,
        status: true,
        pdfUrl: true,
        isCreditNote: true,
        originalInvoiceId: true,
        rectifyingInvoiceId: true,
        paymentMethod: true,
        stripeInvoiceId: true,
        stripeCustomerId: true,
        stripeHostedInvoiceUrl: true,
        stripeInvoicePdfUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update billing statuses
    await prisma.subscriptionBilling.updateMany({
      where: { id: { in: invoiceData.billingIds } },
      data: { status: 'FACTURADO' },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Invoice', invoice.id, {
      action: 'CREATE',
      invoiceData: {
        invoiceNumber: invoice.invoiceNumber,
        clientType: invoice.clientType,
        clientName: invoice.clientName,
        totalAmount: invoice.totalAmount,
        billingIds: invoice.billingIds,
      },
    });

    logger.info('Invoice created:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientType: invoice.clientType,
      clientName: invoice.clientName,
      totalAmount: invoice.totalAmount,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: invoice,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update invoice
router.put('/:id',
  [
    param('id').isString().withMessage('Invoice ID is required'),
    body('clientName').optional().isString().isLength({ min: 1 }).withMessage('Client name must be a non-empty string'),
    body('clientCifDni').optional().isString().isLength({ min: 1 }).withMessage('Client CIF/DNI must be a non-empty string'),
    body('clientAddress').optional().isString().isLength({ min: 1 }).withMessage('Client address must be a non-empty string'),
    body('clientEmail').optional().isEmail().withMessage('Valid client email is required'),
    body('concept').optional().isString().isLength({ min: 1 }).withMessage('Concept must be a non-empty string'),
    body('subtotal').optional().isNumeric().withMessage('Subtotal must be a number'),
    body('vatRate').optional().isNumeric().withMessage('VAT rate must be a number'),
    body('vatAmount').optional().isNumeric().withMessage('VAT amount must be a number'),
    body('totalAmount').optional().isNumeric().withMessage('Total amount must be a number'),
    body('paymentDetails').optional().isArray().withMessage('Payment details must be an array'),
    body('status').optional().isIn(['EMITIDA', 'ENVIADA', 'PAGADA', 'CANCELADA', 'ABONADA']).withMessage('Invalid status'),
    body('pdfUrl').optional().isString().withMessage('PDF URL must be a string'),
    body('paymentMethod').optional().isIn(['INTERNAL', 'STRIPE']).withMessage('Invalid payment method'),
    body('stripeInvoiceId').optional().isString().withMessage('Stripe invoice ID must be a string'),
    body('stripeCustomerId').optional().isString().withMessage('Stripe customer ID must be a string'),
    body('stripeHostedInvoiceUrl').optional().isString().withMessage('Stripe hosted invoice URL must be a string'),
    body('stripeInvoicePdfUrl').optional().isString().withMessage('Stripe invoice PDF URL must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw notFoundErrorHandler('Invoice');
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceSeries: true,
        invoiceYear: true,
        invoiceDate: true,
        billingIds: true,
        clientType: true,
        clientName: true,
        clientCifDni: true,
        clientAddress: true,
        clientEmail: true,
        concept: true,
        subtotal: true,
        vatRate: true,
        vatAmount: true,
        totalAmount: true,
        paymentDetails: true,
        status: true,
        pdfUrl: true,
        isCreditNote: true,
        originalInvoiceId: true,
        rectifyingInvoiceId: true,
        paymentMethod: true,
        stripeInvoiceId: true,
        stripeCustomerId: true,
        stripeHostedInvoiceUrl: true,
        stripeInvoicePdfUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Invoice', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Invoice updated:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    return res.json({
      success: true,
      data: invoice,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete invoice (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Invoice ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw notFoundErrorHandler('Invoice');
    }

    // Check if invoice is paid
    if (invoice.status === 'PAGADA') {
      throw validationErrorHandler('Cannot delete paid invoice');
    }

    // Update billing statuses back to pending
    await prisma.subscriptionBilling.updateMany({
      where: { id: { in: invoice.billingIds } },
      data: { status: 'PENDIENTE' },
    });

    // Delete invoice
    await prisma.invoice.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'Invoice', id, {
      action: 'DELETE',
      invoiceData: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        totalAmount: invoice.totalAmount,
      },
    });

    logger.info('Invoice deleted:', {
      invoiceId: id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      totalAmount: invoice.totalAmount,
      deletedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: { message: 'Invoice deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Create credit note
router.post('/:id/credit-note',
  requireClinicalStaff,
  [
    param('id').isString().withMessage('Invoice ID is required'),
    body('reason').isString().isLength({ min: 1 }).withMessage('Reason is required'),
    body('amount').isNumeric().withMessage('Amount is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { reason, amount } = req.body;

    // Check if invoice exists
    const originalInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!originalInvoice) {
      throw notFoundErrorHandler('Invoice');
    }

    // Check if amount is valid
    if (amount > originalInvoice.totalAmount) {
      throw validationErrorHandler('Credit note amount cannot exceed original invoice amount');
    }

    // Generate credit note number
    const lastCreditNote = await prisma.invoice.findFirst({
      where: { 
        invoiceYear: new Date().getFullYear(),
        isCreditNote: true,
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (lastCreditNote) {
      const lastNumber = parseInt(lastCreditNote.invoiceNumber.replace(/[^\d]/g, ''));
      nextNumber = lastNumber + 1;
    }

    const creditNoteNumber = `AB-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`;

    // Create credit note
    const creditNote = await prisma.invoice.create({
      data: {
        invoiceNumber: creditNoteNumber,
        invoiceSeries: 'AB',
        invoiceYear: new Date().getFullYear(),
        invoiceDate: new Date(),
        billingIds: [],
        clientType: originalInvoice.clientType,
        clientName: originalInvoice.clientName,
        clientCifDni: originalInvoice.clientCifDni,
        clientAddress: originalInvoice.clientAddress,
        clientEmail: originalInvoice.clientEmail,
        concept: `Abono de factura ${originalInvoice.invoiceNumber} - ${reason}`,
        subtotal: amount,
        vatRate: originalInvoice.vatRate,
        vatAmount: (amount * originalInvoice.vatRate) / 100,
        totalAmount: amount,
        paymentDetails: [{
          period: 'Abono',
          students_count: 0,
          price_per_student: 0,
          amount: amount,
        }],
        status: 'EMITIDA',
        pdfUrl: null,
        isCreditNote: true,
        originalInvoiceId: id,
        rectifyingInvoiceId: null,
        paymentMethod: 'INTERNAL',
        stripeInvoiceId: null,
        stripeCustomerId: null,
        stripeHostedInvoiceUrl: null,
        stripeInvoicePdfUrl: null,
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceSeries: true,
        invoiceYear: true,
        invoiceDate: true,
        clientType: true,
        clientName: true,
        clientCifDni: true,
        clientAddress: true,
        clientEmail: true,
        concept: true,
        subtotal: true,
        vatRate: true,
        vatAmount: true,
        totalAmount: true,
        paymentDetails: true,
        status: true,
        isCreditNote: true,
        originalInvoiceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update original invoice
    await prisma.invoice.update({
      where: { id },
      data: { 
        rectifyingInvoiceId: creditNote.id,
        status: 'ABONADA',
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Invoice', creditNote.id, {
      action: 'CREATE_CREDIT_NOTE',
      creditNoteData: {
        creditNoteNumber: creditNote.invoiceNumber,
        originalInvoiceId: id,
        reason,
        amount,
      },
    });

    logger.info('Credit note created:', {
      creditNoteId: creditNote.id,
      creditNoteNumber: creditNote.invoiceNumber,
      originalInvoiceId: id,
      originalInvoiceNumber: originalInvoice.invoiceNumber,
      reason,
      amount,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: creditNote,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get invoice statistics
router.get('/statistics/overview',
  asyncHandler(async (req: any, res: Response) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Get invoice statistics
    const [
      totalInvoices,
      totalAmount,
      invoicesByStatus,
      invoicesByClientType,
      monthlyInvoices,
      recentInvoices,
    ] = await Promise.all([
      prisma.invoice.count({
        where: { invoiceYear: currentYear },
      }),
      prisma.invoice.aggregate({
        where: { invoiceYear: currentYear },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { invoiceYear: currentYear },
        _count: { status: true },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ['clientType'],
        where: { invoiceYear: currentYear },
        _count: { clientType: true },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ['invoiceDate'],
        where: { 
          invoiceYear: currentYear,
          invoiceDate: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
        },
        _count: { invoiceDate: true },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: { invoiceYear: currentYear },
        orderBy: { invoiceDate: 'desc' },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          clientName: true,
          totalAmount: true,
          status: true,
          invoiceDate: true,
        },
      }),
    ]);

    const statistics = {
      totalInvoices,
      totalAmount: totalAmount._sum.totalAmount || 0,
      invoicesByStatus: invoicesByStatus.reduce((acc, item) => {
        acc[item.status] = {
          count: item._count.status,
          amount: item._sum.totalAmount || 0,
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
      invoicesByClientType: invoicesByClientType.reduce((acc, item) => {
        acc[item.clientType] = {
          count: item._count.clientType,
          amount: item._sum.totalAmount || 0,
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
      monthlyInvoices,
      recentInvoices,
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Invoice', undefined, {
      action: 'STATISTICS',
    });

    return res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
