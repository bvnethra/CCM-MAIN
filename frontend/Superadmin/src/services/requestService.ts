import { CalibrationRequest, CreateRequestFormData, RequestStatus, RequestItem } from '../types/request';
import { mockStore } from '../mock/initialStore';
import { apiClient } from '../lib/api/apiClient';

function parseList(res: any): any[] | null {
  if (!res || !res.success) return null;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

export const requestService = {
  async getAll(): Promise<CalibrationRequest[]> {
    try {
      const res = await apiClient.get('/api/requests');
      const list = parseList(res);
      if (list !== null) {
        return list.map((r: any) => ({
          id: r.id,
          requestNumber: r.request_number || r.requestNumber || `REQ-${r.id.substring(0, 6)}`,
          tenantId: r.tenant_id || r.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: r.organization_id || r.organizationId || '00000000-0000-0000-0000-000000000001',
          organizationName: r.organizationName || 'Apex Precision Labs Bangalore',
          clientId: r.client_id || r.clientId || 'cli-1',
          clientName: r.client_name || r.clientName || 'Client',
          clientCode: r.client_code || r.clientCode || 'CLI-001',
          collectionAgentId: r.collection_agent_id || r.collectionAgentId || 'usr-003',
          collectionAgentName: r.collection_agent_name || r.collectionAgentName || 'Rajesh Kumar',
          collectionDate: r.collection_date || r.collectionDate || new Date().toISOString().split('T')[0],
          priority: r.priority || 'MEDIUM',
          status: r.status || 'CREATED',
          remarks: r.remarks || '',
          items: (r.items || []).map((it: any, idx: number) => ({
            id: it.id || `ri-${idx}`,
            requestId: r.id,
            itemId: it.item_id || it.itemId || 'itm-1',
            itemCode: it.item_code || it.itemCode || 'ITM-001',
            itemName: it.item_name || it.itemName || 'Instrument',
            manufacturer: it.manufacturer || 'Fluke',
            model: it.model || 'Standard',
            serialNumber: it.serial_number || it.serialNumber || 'SN-001',
            requestedQuantity: it.requested_quantity || it.requestedQuantity || 1,
            receivedQuantity: it.received_quantity || it.receivedQuantity || 1,
            itemAvailable: it.item_available !== undefined ? it.item_available : true,
            availabilityRemarks: it.availability_remarks || '',
            standardCost: Number(it.standard_cost || it.standardCost) || 1000,
            itemStatus: it.item_status || it.itemStatus || 'PENDING',
          })),
          createdAt: r.created_at || r.createdAt || new Date().toISOString(),
          updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('requestService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.requests];
  },

  async getById(id: string): Promise<CalibrationRequest | null> {
    try {
      const res = await apiClient.get(`/api/requests/${id}`);
      if (res && res.success && res.data) {
        const r = res.data;
        return {
          id: r.id,
          requestNumber: r.request_number || r.requestNumber || `REQ-${r.id.substring(0, 6)}`,
          tenantId: r.tenant_id || r.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: r.organization_id || r.organizationId || '00000000-0000-0000-0000-000000000001',
          organizationName: r.organizationName || 'Apex Precision Labs Bangalore',
          clientId: r.client_id || r.clientId,
          clientName: r.client_name || r.clientName || 'Client',
          clientCode: r.client_code || r.clientCode,
          collectionAgentId: r.collection_agent_id || r.collectionAgentId || 'usr-003',
          collectionAgentName: r.collection_agent_name || r.collectionAgentName || 'Rajesh Kumar',
          collectionDate: r.collection_date || r.collectionDate || new Date().toISOString().split('T')[0],
          priority: r.priority || 'MEDIUM',
          status: r.status || 'CREATED',
          remarks: r.remarks || '',
          items: (r.items || []).map((it: any, idx: number) => ({
            id: it.id || `ri-${idx}`,
            requestId: r.id,
            itemId: it.item_id || it.itemId,
            itemCode: it.item_code || it.itemCode || 'ITM-001',
            itemName: it.item_name || it.itemName || 'Instrument',
            manufacturer: it.manufacturer,
            model: it.model,
            serialNumber: it.serial_number || it.serialNumber,
            requestedQuantity: it.requested_quantity || it.requestedQuantity || 1,
            receivedQuantity: it.received_quantity || it.receivedQuantity || 1,
            itemAvailable: it.item_available !== undefined ? it.item_available : true,
            availabilityRemarks: it.availability_remarks,
            standardCost: Number(it.standard_cost || it.standardCost) || 1000,
            itemStatus: it.item_status || it.itemStatus || 'PENDING',
          })),
          createdAt: r.created_at || r.createdAt || new Date().toISOString(),
          updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('requestService.getById API fetch warning:', err);
    }
    const req = mockStore.data.requests.find((r) => r.id === id || r.requestNumber === id);
    return req ? JSON.parse(JSON.stringify(req)) : null;
  },

  async create(data: CreateRequestFormData): Promise<CalibrationRequest> {
    try {
      const payload = {
        clientId: data.clientId,
        priority: data.priority,
        collectionDate: data.collectionDate,
        remarks: data.remarks,
        items: data.items.map(it => ({
          itemId: it.itemId,
          serialNumber: it.serialNumber,
          requestedQuantity: it.quantity,
          receivedQuantity: it.quantity,
          itemAvailable: it.itemAvailable,
          availabilityRemarks: it.availabilityRemarks
        }))
      };
      const res = await apiClient.post('/api/requests', payload);
      if (res && res.success && res.data) {
        const r = res.data;
        const client = mockStore.data.clients.find((c) => c.id === data.clientId);
        const newReq: CalibrationRequest = {
          id: r.id,
          requestNumber: r.request_number || r.requestNumber || `REQ-2026-${String(mockStore.data.requests.length + 1).padStart(3, '0')}`,
          tenantId: '00000000-0000-0000-0000-000000000001',
          organizationId: '00000000-0000-0000-0000-000000000001',
          organizationName: 'Apex Precision Labs Bangalore',
          clientId: data.clientId,
          clientName: client?.clientName || 'Client',
          clientCode: client?.clientCode || 'CLI-001',
          collectionAgentId: 'usr-003',
          collectionAgentName: 'Rajesh Kumar',
          collectionDate: data.collectionDate || new Date().toISOString().split('T')[0],
          priority: data.priority,
          status: 'CREATED',
          remarks: data.remarks,
          items: data.items.map((it, idx) => ({
            id: `ri-${Date.now()}-${idx}`,
            requestId: r.id,
            itemId: it.itemId,
            itemCode: 'ITM-GEN',
            itemName: 'General Instrument',
            serialNumber: it.serialNumber,
            requestedQuantity: it.quantity,
            receivedQuantity: it.quantity,
            itemAvailable: it.itemAvailable,
            availabilityRemarks: it.availabilityRemarks,
            standardCost: 1000,
            itemStatus: 'PENDING',
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockStore.data.requests.unshift(newReq);
        return newReq;
      }
    } catch (err) {
      console.warn('requestService.create API warning:', err);
    }
    const client = mockStore.data.clients.find((c) => c.id === data.clientId);
    const count = mockStore.data.requests.length + 1;
    const requestNumber = `REQ-2026-${String(count).padStart(3, '0')}`;
    const requestId = `req-${Date.now()}`;

    const items: RequestItem[] = data.items.map((it, idx) => {
      const masterItem = mockStore.data.items.find((m) => m.id === it.itemId);
      return {
        id: `ri-${Date.now()}-${idx}`,
        requestId,
        itemId: it.itemId,
        itemCode: masterItem?.itemCode || 'ITM-GEN',
        itemName: masterItem?.itemName || 'General Instrument',
        manufacturer: masterItem?.manufacturer,
        model: masterItem?.model,
        serialNumber: it.serialNumber,
        requestedQuantity: it.quantity,
        receivedQuantity: it.quantity,
        itemAvailable: it.itemAvailable,
        availabilityRemarks: it.availabilityRemarks,
        standardCost: masterItem?.standardCost || 1000,
        itemStatus: 'PENDING',
      };
    });

    const newRequest: CalibrationRequest = {
      id: requestId,
      requestNumber,
      tenantId: '00000000-0000-0000-0000-000000000001',
      organizationId: '00000000-0000-0000-0000-000000000001',
      organizationName: 'Apex Precision Labs Bangalore',
      clientId: data.clientId,
      clientName: client?.clientName || 'Unknown Client',
      clientCode: client?.clientCode,
      collectionAgentId: 'usr-003',
      collectionAgentName: 'Rajesh Kumar',
      collectionDate: data.collectionDate || new Date().toISOString().split('T')[0],
      priority: data.priority,
      status: 'CREATED',
      remarks: data.remarks,
      items,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };

    mockStore.data.requests.unshift(newRequest);
    return newRequest;
  },

  async updateStatus(id: string, status: RequestStatus, remarks?: string): Promise<CalibrationRequest> {
    try {
      await apiClient.put(`/api/requests/${id}/status`, { status, remarks });
    } catch (err) {
      console.warn('requestService.updateStatus API warning:', err);
    }
    const req = mockStore.data.requests.find((r) => r.id === id || r.requestNumber === id);
    if (!req) throw new Error('Request not found');

    req.status = status;
    if (remarks) req.remarks = (req.remarks ? req.remarks + ' | ' : '') + remarks;
    req.updatedAt = new Date().toISOString();

    mockStore.data.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userId: 'usr-002',
      userName: 'System User',
      role: 'Admin',
      tenantId: '00000000-0000-0000-0000-000000000001',
      organizationId: '00000000-0000-0000-0000-000000000001',
      module: 'request',
      action: 'status_change',
      recordId: req.id,
      recordIdentifier: req.requestNumber,
      oldValue: `Status changed to ${status}`,
      newValue: remarks || `Transitioned to ${status}`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
    });

    return { ...req };
  },

  async updateItem(requestId: string, itemId: string, updates: Partial<RequestItem>): Promise<CalibrationRequest> {
    const req = mockStore.data.requests.find((r) => r.id === requestId || r.requestNumber === requestId);
    if (!req) throw new Error('Request not found');

    const itemIndex = req.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) throw new Error('Request item not found');

    req.items[itemIndex] = {
      ...req.items[itemIndex],
      ...updates,
    };
    req.updatedAt = new Date().toISOString();
    return { ...req };
  },

  async delete(id: string): Promise<void> {
    mockStore.data.requests = mockStore.data.requests.filter((r) => r.id !== id && r.requestNumber !== id);
  },
};
