import { DigitalSignature, DispatchRecord, DeliveryRecord, AuditLogEntry, SignatureType } from '../types/dispatch';
import { mockStore } from '../mock/initialStore';
import { apiClient } from '../lib/api/apiClient';

export const signatureService = {
  async getAll(): Promise<DigitalSignature[]> {
    try {
      const res = await apiClient.get('/api/execution/signatures');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((s: any) => ({
          id: s.id,
          type: s.type || 'INVOICE',
          referenceId: s.reference_id || s.referenceId,
          referenceNumber: s.reference_number || s.referenceNumber || `REF-${s.id.substring(0, 6)}`,
          clientId: s.client_id || s.clientId || 'cli-001',
          clientName: s.client_name || s.clientName || 'Client',
          signatoryName: s.signatory_name || s.signatoryName || 'Signatory',
          signatoryDesignation: s.signatory_designation || s.signatoryDesignation || 'Manager',
          signatureData: s.signature_data || s.signatureData || '',
          signedDate: s.signed_date || s.signedDate || new Date().toLocaleString(),
          status: s.status || 'SIGNED',
          remarks: s.remarks || '',
          ipAddress: s.ip_address || s.ipAddress || '127.0.0.1',
        }));
      }
    } catch (err) {
      console.warn('signatureService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.signatures];
  },

  async sign(
    type: SignatureType,
    referenceId: string,
    signatoryName: string,
    signatoryDesignation: string,
    signatureData: string,
    remarks?: string
  ): Promise<DigitalSignature> {
    try {
      const payload = {
        type,
        referenceId,
        signatoryName,
        signatoryDesignation,
        signatureData,
        remarks
      };
      const res = await apiClient.post('/api/execution/signatures', payload);
      if (res && res.success && res.data) {
        const s = res.data;
        const newSig: DigitalSignature = {
          id: s.id,
          type,
          referenceId,
          referenceNumber: s.reference_number || s.referenceNumber || referenceId,
          clientId: 'cli-001',
          clientName: s.client_name || s.clientName || 'Authorized Client',
          signatoryName,
          signatoryDesignation,
          signatureData,
          signedDate: new Date().toLocaleString(),
          status: 'SIGNED',
          remarks,
          ipAddress: '127.0.0.1',
        };
        mockStore.data.signatures.unshift(newSig);
        return newSig;
      }
    } catch (err) {
      console.warn('signatureService.sign API warning:', err);
    }
    let clientName = 'Authorized Client';
    let referenceNumber = referenceId;

    if (type === 'INVOICE') {
      const inv = mockStore.data.invoices.find((i) => i.id === referenceId);
      if (inv) {
        inv.isSigned = true;
        inv.status = 'SIGNED';
        inv.signatureDate = new Date().toLocaleString();
        clientName = inv.clientName;
        referenceNumber = inv.invoiceNumber;
      }
    }

    const newSig: DigitalSignature = {
      id: `sig-${Date.now()}`,
      type,
      referenceId,
      referenceNumber,
      clientId: 'cli-001',
      clientName,
      signatoryName,
      signatoryDesignation,
      signatureData,
      signedDate: new Date().toLocaleString(),
      status: 'SIGNED',
      remarks,
      ipAddress: '127.0.0.1',
    };

    mockStore.data.signatures.unshift(newSig);
    return newSig;
  },
};

export const dispatchService = {
  async getAll(): Promise<DispatchRecord[]> {
    try {
      const res = await apiClient.get('/api/execution/dispatches');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((d: any) => ({
          id: d.id,
          dispatchNumber: d.dispatch_number || d.dispatchNumber || `DSP-${d.id.substring(0, 6)}`,
          requestId: d.request_id || d.requestId,
          requestNumber: d.request_number || d.requestNumber || 'REQ-001',
          clientId: d.client_id || d.clientId,
          clientName: d.client_name || d.clientName || 'Client',
          dispatchDate: d.dispatch_date || d.dispatchDate || new Date().toISOString().split('T')[0],
          transportMode: d.transport_mode || d.transportMode || 'COURIER',
          courierName: d.courier_name || d.courierName || d.courierAgency || 'DTDC Express',
          trackingNumber: d.tracking_number || d.trackingNumber || 'TRK-10023',
          contactPerson: d.contact_person || d.contactPerson || 'Logistics Coordinator',
          deliveryAddress: d.delivery_address || d.deliveryAddress || 'Client Operations Center',
          items: (d.items || []).map((it: any, idx: number) => ({
            id: it.id || `di-${idx}`,
            requestItemId: it.request_item_id || it.requestItemId || `ri-${idx}`,
            itemName: it.item_name || it.itemName || 'Instrument',
            serialNumber: it.serial_number || it.serialNumber || 'SN-001',
            quantity: Number(it.quantity) || 1,
          })),
          totalPackages: Number(d.total_packages || d.totalPackages) || 1,
          status: d.status || 'DISPATCHED',
          remarks: d.remarks || ''
        }));
      }
    } catch (err) {
      console.warn('dispatchService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.dispatches];
  },

  async create(data: Omit<DispatchRecord, 'id' | 'dispatchNumber' | 'status'>): Promise<DispatchRecord> {
    try {
      const payload = {
        requestId: data.requestId,
        dispatchDate: data.dispatchDate,
        courierAgency: data.courierName,
        trackingNumber: data.trackingNumber,
        modeOfTransport: data.transportMode,
        remarks: data.remarks
      };
      const res = await apiClient.post('/api/execution/dispatches', payload);
      if (res && res.success && res.data) {
        const d = res.data;
        const newDispatch: DispatchRecord = {
          ...data,
          id: d.id,
          dispatchNumber: d.dispatch_number || d.dispatchNumber || `DSP-2026-${String(mockStore.data.dispatches.length + 1).padStart(3, '0')}`,
          status: 'DISPATCHED',
        };
        mockStore.data.dispatches.unshift(newDispatch);
        return newDispatch;
      }
    } catch (err) {
      console.warn('dispatchService.create API warning:', err);
    }
    const count = mockStore.data.dispatches.length + 1;
    const dispatchNumber = `DSP-2026-${String(count).padStart(3, '0')}`;
    const dispatchId = `dsp-${Date.now()}`;

    const newDispatch: DispatchRecord = {
      ...data,
      id: dispatchId,
      dispatchNumber,
      status: 'DISPATCHED',
    };
    mockStore.data.dispatches.unshift(newDispatch);

    const delCount = mockStore.data.deliveries.length + 1;
    const newDelivery: DeliveryRecord = {
      id: `del-${Date.now()}`,
      deliveryNumber: `DEL-2026-${String(delCount).padStart(3, '0')}`,
      dispatchId: newDispatch.id,
      dispatchNumber: newDispatch.dispatchNumber,
      requestId: newDispatch.requestId,
      requestNumber: newDispatch.requestNumber,
      clientId: newDispatch.clientId,
      clientName: newDispatch.clientName,
      dispatchDate: newDispatch.dispatchDate,
      status: 'IN_TRANSIT',
    };
    mockStore.data.deliveries.unshift(newDelivery);

    return newDispatch;
  },
};

export const deliveryService = {
  async getAll(): Promise<DeliveryRecord[]> {
    try {
      const res = await apiClient.get('/api/execution/deliveries');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((del: any) => ({
          id: del.id,
          deliveryNumber: del.delivery_number || del.deliveryNumber || `DEL-${del.id.substring(0, 6)}`,
          dispatchId: del.dispatch_id || del.dispatchId,
          dispatchNumber: del.dispatch_number || del.dispatchNumber,
          requestId: del.request_id || del.requestId,
          requestNumber: del.request_number || del.requestNumber,
          clientId: del.client_id || del.clientId,
          clientName: del.client_name || del.clientName || 'Client',
          dispatchDate: del.dispatch_date || del.dispatchDate || new Date().toISOString().split('T')[0],
          receivedDate: del.received_date || del.receivedDate,
          recipientName: del.recipient_name || del.recipientName,
          recipientPhone: del.recipient_phone || del.recipientPhone,
          status: del.status || 'IN_TRANSIT'
        }));
      }
    } catch (err) {
      console.warn('deliveryService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.deliveries];
  },

  async markReceived(deliveryId: string, recipientName: string, recipientPhone: string): Promise<DeliveryRecord> {
    try {
      await apiClient.put(`/api/execution/deliveries/${deliveryId}/status`, {
        status: 'RECEIVED',
        recipientName,
        recipientPhone
      });
    } catch (err) {
      console.warn('deliveryService.markReceived API warning:', err);
    }
    const del = mockStore.data.deliveries.find((d) => d.id === deliveryId);
    if (!del) throw new Error('Delivery record not found');

    del.status = 'RECEIVED';
    del.receivedDate = new Date().toLocaleString();
    del.recipientName = recipientName;
    del.recipientPhone = recipientPhone;

    return { ...del };
  },
};

export const auditService = {
  async getAll(): Promise<AuditLogEntry[]> {
    return [...mockStore.data.auditLogs];
  },
};
