import { Quotation, QuotationFormData, QuotationItem } from '../types/quotation';
import { ApprovalRecord, ApprovalActionType, PurchaseOrder, Invoice, InvoiceType, PurchaseOrderItem } from '../types/invoice';
import { mockStore } from '../mock/initialStore';
import { apiClient } from '../lib/api/apiClient';

function parseList(res: any): any[] | null {
  if (!res || !res.success) return null;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

export const quotationService = {
  async getAll(): Promise<Quotation[]> {
    try {
      const res = await apiClient.get('/api/commercial/quotations');
      const list = parseList(res);
      if (list !== null) {
        return list.map((q: any) => ({
          id: q.id,
          quotationNumber: q.quotation_number || q.quotationNumber || `QT-${q.id.substring(0, 6)}`,
          requestId: q.request_id || q.requestId,
          requestNumber: q.request_number || q.requestNumber,
          clientId: q.client_id || q.clientId,
          clientName: q.client_name || q.clientName || 'Valued Client',
          quotationDate: q.quotation_date || q.quotationDate || new Date().toISOString().split('T')[0],
          validUntil: q.valid_until || q.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          currency: q.currency || 'INR',
          status: q.status || 'PENDING_APPROVAL',
          items: (q.items || []).map((it: any, idx: number) => ({
            id: it.id || `qi-${idx}`,
            itemId: it.item_id || it.itemId || 'itm-1',
            itemName: it.item_name || it.itemName || 'Instrument',
            itemCode: it.item_code || it.itemCode || 'ITM-001',
            description: it.description || '',
            standardCost: Number(it.standard_cost || it.standardCost) || 1000,
            overrideCost: it.override_cost !== undefined ? Number(it.override_cost) : undefined,
            overrideReason: it.override_reason || '',
            quantity: Number(it.quantity) || 1,
            taxRate: Number(it.tax_rate || it.taxRate) || 18,
            totalAmount: Number(it.total_amount || it.totalAmount) || 1180,
          })),
          subtotal: Number(q.subtotal) || 1000,
          taxAmount: Number(q.tax_amount || q.taxAmount) || 180,
          discountAmount: Number(q.discount_amount || q.discountAmount) || 0,
          totalAmount: Number(q.total_amount || q.totalAmount) || 1180,
          remarks: q.remarks || '',
          createdBy: q.created_by || q.createdBy || 'Commercial User',
          createdAt: q.created_at || q.createdAt || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('quotationService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.quotations];
  },

  async getById(id: string): Promise<Quotation | null> {
    try {
      const res = await apiClient.get(`/api/commercial/quotations/${id}`);
      if (res && res.success && res.data) {
        const q = res.data;
        return {
          id: q.id,
          quotationNumber: q.quotation_number || q.quotationNumber,
          requestId: q.request_id || q.requestId,
          requestNumber: q.request_number || q.requestNumber,
          clientId: q.client_id || q.clientId,
          clientName: q.client_name || q.clientName || 'Valued Client',
          quotationDate: q.quotation_date || q.quotationDate || new Date().toISOString().split('T')[0],
          validUntil: q.valid_until || q.validUntil,
          currency: q.currency || 'INR',
          status: q.status || 'PENDING_APPROVAL',
          items: (q.items || []).map((it: any, idx: number) => ({
            id: it.id || `qi-${idx}`,
            itemId: it.item_id || it.itemId,
            itemName: it.item_name || it.itemName,
            itemCode: it.item_code || it.itemCode,
            description: it.description,
            standardCost: Number(it.standard_cost || it.standardCost) || 1000,
            overrideCost: it.override_cost !== undefined ? Number(it.override_cost) : undefined,
            overrideReason: it.override_reason,
            quantity: Number(it.quantity) || 1,
            taxRate: Number(it.tax_rate || it.taxRate) || 18,
            totalAmount: Number(it.total_amount || it.totalAmount) || 1180,
          })),
          subtotal: Number(q.subtotal) || 1000,
          taxAmount: Number(q.tax_amount || q.taxAmount) || 180,
          discountAmount: Number(q.discount_amount || q.discountAmount) || 0,
          totalAmount: Number(q.total_amount || q.totalAmount) || 1180,
          remarks: q.remarks || '',
          createdBy: q.created_by || q.createdBy || 'Commercial User',
          createdAt: q.created_at || q.createdAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('quotationService.getById API fetch warning:', err);
    }
    const q = mockStore.data.quotations.find((item) => item.id === id || item.quotationNumber === id);
    return q ? { ...q } : null;
  },

  async create(data: QuotationFormData): Promise<Quotation> {
    try {
      const payload = {
        requestId: data.requestId,
        clientId: data.clientId,
        validUntil: data.validUntil,
        currency: data.currency || 'INR',
        discountAmount: Number(data.discountAmount) || 0,
        remarks: data.remarks,
        items: data.items.map(it => ({
          itemId: it.itemId,
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: it.overrideCost !== undefined && it.overrideCost !== null ? Number(it.overrideCost) : Number(it.standardCost),
          overrideReason: it.overrideReason,
          taxRate: Number(it.taxRate) || 18
        }))
      };
      const res = await apiClient.post('/api/commercial/quotations', payload);
      if (res && res.success && res.data) {
        const q = res.data;
        const client = mockStore.data.clients.find((c) => c.id === data.clientId);
        const newQ: Quotation = {
          id: q.id,
          quotationNumber: q.quotation_number || q.quotationNumber || `QT-2026-${String(mockStore.data.quotations.length + 1).padStart(3, '0')}`,
          requestId: data.requestId,
          clientId: data.clientId,
          clientName: client?.clientName || 'Valued Client',
          quotationDate: new Date().toISOString().split('T')[0],
          validUntil: data.validUntil,
          currency: data.currency || 'INR',
          status: 'PENDING_APPROVAL',
          items: data.items.map((it, idx) => ({
            id: `qi-${Date.now()}-${idx}`,
            itemId: it.itemId,
            itemName: it.itemName,
            itemCode: it.itemCode,
            description: it.description,
            standardCost: Number(it.standardCost),
            overrideCost: it.overrideCost !== undefined ? Number(it.overrideCost) : undefined,
            overrideReason: it.overrideReason,
            quantity: Number(it.quantity),
            taxRate: Number(it.taxRate) || 18,
            totalAmount: (it.overrideCost || it.standardCost) * it.quantity,
          })),
          subtotal: Number(q.subtotal) || 1000,
          taxAmount: Number(q.tax_amount) || 180,
          discountAmount: Number(data.discountAmount) || 0,
          totalAmount: Number(q.total_amount) || 1180,
          remarks: data.remarks,
          createdBy: 'Commercial User',
          createdAt: new Date().toISOString(),
        };
        mockStore.data.quotations.unshift(newQ);
        return newQ;
      }
    } catch (err) {
      console.warn('quotationService.create API warning:', err);
    }
    const client = mockStore.data.clients.find((c) => c.id === data.clientId);
    const count = mockStore.data.quotations.length + 1;
    const quotationNumber = `QT-2026-${String(count).padStart(3, '0')}`;
    const quotationId = `qt-${Date.now()}`;

    let subtotal = 0;
    let taxAmount = 0;

    const items: QuotationItem[] = data.items.map((it, idx) => {
      const effectiveRate = it.overrideCost !== undefined && it.overrideCost !== null ? Number(it.overrideCost) : Number(it.standardCost);
      const lineTotal = effectiveRate * Number(it.quantity);
      const lineTax = (lineTotal * (Number(it.taxRate) || 18)) / 100;
      subtotal += lineTotal;
      taxAmount += lineTax;

      return {
        id: `qi-${Date.now()}-${idx}`,
        itemId: it.itemId,
        itemName: it.itemName,
        itemCode: it.itemCode,
        description: it.description,
        standardCost: Number(it.standardCost),
        overrideCost: it.overrideCost !== undefined ? Number(it.overrideCost) : undefined,
        overrideReason: it.overrideReason,
        quantity: Number(it.quantity),
        taxRate: Number(it.taxRate) || 18,
        totalAmount: lineTotal,
      };
    });

    const discount = Number(data.discountAmount) || 0;
    const totalAmount = subtotal + taxAmount - discount;

    const newQuotation: Quotation = {
      id: quotationId,
      quotationNumber,
      requestId: data.requestId,
      requestNumber: data.requestId ? mockStore.data.requests.find((r) => r.id === data.requestId)?.requestNumber : undefined,
      clientId: data.clientId,
      clientName: client?.clientName || 'Valued Client',
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil: data.validUntil,
      currency: data.currency || 'INR',
      status: 'PENDING_APPROVAL',
      items,
      subtotal,
      taxAmount,
      discountAmount: discount,
      totalAmount,
      remarks: data.remarks,
      createdBy: 'Amit Verma (Commercial User)',
      createdAt: new Date().toISOString(),
    };

    mockStore.data.quotations.unshift(newQuotation);

    const newApproval: ApprovalRecord = {
      id: `app-${Date.now()}`,
      quotationId: newQuotation.id,
      quotationNumber: newQuotation.quotationNumber,
      clientName: newQuotation.clientName,
      totalAmount: newQuotation.totalAmount,
      currency: newQuotation.currency,
      createdBy: newQuotation.createdBy,
      createdDate: newQuotation.quotationDate,
      status: 'PENDING',
      itemsCount: newQuotation.items.length,
      approverComments: 'Pending review by designated Approver',
    };
    mockStore.data.approvals.unshift(newApproval);

    return newQuotation;
  },
};

export const approvalService = {
  async getAll(): Promise<ApprovalRecord[]> {
    try {
      const res = await apiClient.get('/api/commercial/approvals');
      const list = parseList(res);
      if (list !== null) {
        return list.map((a: any) => ({
          id: a.id,
          quotationId: a.quotation_id || a.quotationId,
          quotationNumber: a.quotation_number || a.quotationNumber || `QT-${a.id.substring(0, 6)}`,
          clientName: a.client_name || a.clientName || 'Client',
          totalAmount: Number(a.total_amount || a.totalAmount) || 1000,
          currency: a.currency || 'INR',
          createdBy: a.created_by || a.createdBy || 'Commercial User',
          createdDate: a.created_date || a.createdDate || new Date().toISOString().split('T')[0],
          status: a.status || 'PENDING',
          itemsCount: Number(a.items_count || a.itemsCount) || 1,
          approverComments: a.approver_comments || a.approverComments || '',
          reviewedBy: a.reviewed_by || a.reviewedBy,
          reviewedDate: a.reviewed_date || a.reviewedDate
        }));
      }
    } catch (err) {
      console.warn('approvalService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.approvals];
  },

  async processApproval(
    approvalId: string,
    action: ApprovalActionType,
    comments: string,
    approverName: string = 'Dr. Vikram Malhotra'
  ): Promise<ApprovalRecord> {
    try {
      if (action === 'APPROVE') {
        await apiClient.post(`/api/commercial/approvals/${approvalId}/approve`, { remarks: comments });
      } else if (action === 'REJECT') {
        await apiClient.post(`/api/commercial/approvals/${approvalId}/reject`, { remarks: comments });
      }
    } catch (err) {
      console.warn('approvalService.processApproval API warning:', err);
    }
    const app = mockStore.data.approvals.find((a) => a.id === approvalId);
    if (!app) throw new Error('Approval record not found');

    const quotation = mockStore.data.quotations.find((q) => q.id === app.quotationId);

    if (action === 'APPROVE') {
      app.status = 'APPROVED';
      if (quotation) {
        quotation.status = 'APPROVED';
        quotation.approvedBy = approverName;
        quotation.approvedAt = new Date().toLocaleString();
        quotation.approvalRemarks = comments;
      }
    } else if (action === 'REJECT') {
      app.status = 'REJECTED';
      if (quotation) {
        quotation.status = 'REJECTED';
        quotation.approvalRemarks = comments;
      }
    } else if (action === 'REVISE') {
      app.status = 'REVISION_REQUIRED';
      if (quotation) {
        quotation.status = 'REVISION_REQUIRED';
        quotation.approvalRemarks = comments;
      }
    }

    app.approverComments = comments;
    app.reviewedBy = approverName;
    app.reviewedDate = new Date().toISOString().split('T')[0];

    return { ...app };
  },
};

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    try {
      const res = await apiClient.get('/api/commercial/purchase-orders');
      const list = parseList(res);
      if (list !== null) {
        return list.map((po: any) => ({
          id: po.id,
          poNumber: po.po_number || po.poNumber || `PO-${po.id.substring(0, 6)}`,
          vendorId: po.vendor_id || po.vendorId || 'ven-1',
          vendorName: po.vendor_name || po.vendorName || 'Vendor',
          poDate: po.issue_date || po.issueDate || po.poDate || new Date().toISOString().split('T')[0],
          expectedDate: po.delivery_date || po.deliveryDate || po.expectedDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          totalAmount: Number(po.total_amount || po.totalAmount) || 5000,
          status: po.status || 'ISSUED',
          items: (po.items || []).map((it: any, idx: number) => ({
            id: it.id || `poi-${idx}`,
            itemId: it.item_id || it.itemId || 'itm-1',
            itemName: it.item_name || it.itemName || 'Item',
            itemCode: it.item_code || it.itemCode || 'ITM-001',
            quantity: Number(it.quantity) || 1,
            unitRate: Number(it.unit_rate || it.unitRate) || 1000,
            totalAmount: Number(it.total_amount || it.totalAmount) || 1000,
          })),
          remarks: po.notes || po.remarks || ''
        }));
      }
    } catch (err) {
      console.warn('purchaseOrderService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.purchaseOrders];
  },

  async create(data: Omit<PurchaseOrder, 'id' | 'status'>): Promise<PurchaseOrder> {
    try {
      const payload = {
        vendorId: data.vendorId,
        poNumber: data.poNumber,
        issueDate: data.poDate,
        deliveryDate: data.expectedDate,
        notes: data.remarks
      };
      const res = await apiClient.post('/api/commercial/purchase-orders', payload);
      if (res && res.success && res.data) {
        const po = res.data;
        const newPO: PurchaseOrder = {
          ...data,
          id: po.id,
          status: 'ISSUED',
        };
        mockStore.data.purchaseOrders.unshift(newPO);
        return newPO;
      }
    } catch (err) {
      console.warn('purchaseOrderService.create API warning:', err);
    }
    const newPO: PurchaseOrder = {
      ...data,
      id: `po-${Date.now()}`,
      status: 'ISSUED',
    };
    mockStore.data.purchaseOrders.unshift(newPO);
    return newPO;
  },
};

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    try {
      const res = await apiClient.get('/api/commercial/invoices');
      const list = parseList(res);
      if (list !== null) {
        return list.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number || inv.invoiceNumber || `INV-${inv.id.substring(0, 6)}`,
          invoiceType: inv.invoice_type || inv.invoiceType || 'FULL_REQUEST',
          clientId: inv.client_id || inv.clientId,
          clientName: inv.client_name || inv.clientName || 'Client',
          requestId: inv.request_id || inv.requestId,
          requestNumber: inv.request_number || inv.requestNumber,
          invoiceDate: inv.invoice_date || inv.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: inv.due_date || inv.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          items: (inv.items || []).map((it: any, idx: number) => ({
            id: it.id || `ii-${idx}`,
            description: it.description || 'Calibration Certification Service',
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 1000,
            taxRate: Number(it.tax_rate || it.taxRate) || 18,
            taxAmount: Number(it.tax_amount || it.taxAmount) || 180,
            total: Number(it.total) || 1180,
          })),
          subtotal: Number(inv.subtotal) || 1000,
          taxAmount: Number(inv.tax_amount || inv.taxAmount) || 180,
          totalAmount: Number(inv.total_amount || inv.totalAmount) || 1180,
          status: inv.status || 'ISSUED',
          isSigned: inv.is_signed || inv.isSigned || false,
          notes: inv.notes || '',
        }));
      }
    } catch (err) {
      console.warn('invoiceService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.invoices];
  },

  async getById(id: string): Promise<Invoice | null> {
    try {
      const res = await apiClient.get(`/api/commercial/invoices/${id}`);
      if (res && res.success && res.data) {
        const inv = res.data;
        return {
          id: inv.id,
          invoiceNumber: inv.invoice_number || inv.invoiceNumber,
          invoiceType: inv.invoice_type || inv.invoiceType || 'FULL_REQUEST',
          clientId: inv.client_id || inv.clientId,
          clientName: inv.client_name || inv.clientName || 'Client',
          requestId: inv.request_id || inv.requestId,
          requestNumber: inv.request_number || inv.requestNumber,
          invoiceDate: inv.invoice_date || inv.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: inv.due_date || inv.dueDate,
          items: (inv.items || []).map((it: any, idx: number) => ({
            id: it.id || `ii-${idx}`,
            description: it.description,
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 1000,
            taxRate: Number(it.tax_rate || it.taxRate) || 18,
            taxAmount: Number(it.tax_amount || it.taxAmount) || 180,
            total: Number(it.total) || 1180,
          })),
          subtotal: Number(inv.subtotal) || 1000,
          taxAmount: Number(inv.tax_amount || inv.taxAmount) || 180,
          totalAmount: Number(inv.total_amount || inv.totalAmount) || 1180,
          status: inv.status || 'ISSUED',
          isSigned: inv.is_signed || inv.isSigned || false,
          notes: inv.notes || '',
        };
      }
    } catch (err) {
      console.warn('invoiceService.getById API fetch warning:', err);
    }
    const inv = mockStore.data.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    return inv ? { ...inv } : null;
  },

  async create(
    type: InvoiceType,
    clientId: string,
    requestId?: string,
    itemIds?: string[],
    notes?: string
  ): Promise<Invoice> {
    try {
      const payload = {
        invoiceType: type,
        clientId,
        requestId,
        notes
      };
      const res = await apiClient.post('/api/commercial/invoices', payload);
      if (res && res.success && res.data) {
        const inv = res.data;
        const client = mockStore.data.clients.find((c) => c.id === clientId);
        const req = requestId ? mockStore.data.requests.find((r) => r.id === requestId) : undefined;
        const newInvoice: Invoice = {
          id: inv.id,
          invoiceNumber: inv.invoice_number || inv.invoiceNumber || `INV-2026-${String(mockStore.data.invoices.length + 1).padStart(3, '0')}`,
          invoiceType: type,
          clientId,
          clientName: client?.clientName || 'Client',
          requestId,
          requestNumber: req?.requestNumber,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          items: [],
          subtotal: Number(inv.subtotal) || 1000,
          taxAmount: Number(inv.tax_amount) || 180,
          totalAmount: Number(inv.total_amount) || 1180,
          status: 'ISSUED',
          isSigned: false,
          notes: notes || `${type} commercial invoice generated`,
        };
        mockStore.data.invoices.unshift(newInvoice);
        return newInvoice;
      }
    } catch (err) {
      console.warn('invoiceService.create API warning:', err);
    }
    const client = mockStore.data.clients.find((c) => c.id === clientId);
    const req = requestId ? mockStore.data.requests.find((r) => r.id === requestId) : undefined;
    const count = mockStore.data.invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(count).padStart(3, '0')}`;

    let subtotal = 0;
    const items = (req?.items || [])
      .filter((it) => (!itemIds || itemIds.length === 0 || itemIds.includes(it.id)))
      .map((it, idx) => {
        const rate = it.overrideCost || it.standardCost || 1000;
        const total = rate * (it.receivedQuantity || it.requestedQuantity || 1);
        const tax = (total * 18) / 100;
        subtotal += total;
        return {
          id: `ii-${Date.now()}-${idx}`,
          description: `${it.itemName} (${it.serialNumber}) Calibration Certification`,
          quantity: it.receivedQuantity || 1,
          rate,
          taxRate: 18,
          taxAmount: tax,
          total: total + tax,
        };
      });

    const taxAmount = (subtotal * 18) / 100;
    const totalAmount = subtotal + taxAmount;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceType: type,
      clientId,
      clientName: client?.clientName || 'Client',
      requestId,
      requestNumber: req?.requestNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'ISSUED',
      isSigned: false,
      notes: notes || `${type} commercial invoice generated`,
    };

    mockStore.data.invoices.unshift(newInvoice);
    return newInvoice;
  },
};
