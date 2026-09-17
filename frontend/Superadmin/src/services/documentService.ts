import { DocumentRecord } from '../types/verification';
import { mockStore } from '../mock/initialStore';

export const documentService = {
  async getByRequestId(requestId: string): Promise<DocumentRecord[]> {
    await new Promise((res) => setTimeout(res, 100));
    return mockStore.data.documents.filter((d) => d.requestId === requestId);
  },

  async upload(doc: Omit<DocumentRecord, 'id' | 'uploadedDate' | 'status'>): Promise<DocumentRecord> {
    await new Promise((res) => setTimeout(res, 200));
    const newDoc: DocumentRecord = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'UPLOADED',
    };
    mockStore.data.documents.push(newDoc);
    return newDoc;
  },

  async delete(id: string): Promise<void> {
    await new Promise((res) => setTimeout(res, 150));
    mockStore.data.documents = mockStore.data.documents.filter((d) => d.id !== id);
  },

  async checkMandatoryDocuments(requestId: string): Promise<{ valid: boolean; missing: string[] }> {
    await new Promise((res) => setTimeout(res, 50));
    const requiredTypes = ['COLLECTION_PROOF', 'RECEIPT_PROOF'];
    const uploadedDocs = mockStore.data.documents.filter((d) => d.requestId === requestId);
    const uploadedTypes = new Set(uploadedDocs.map((d) => d.documentType));

    const missing = requiredTypes.filter((t) => !uploadedTypes.has(t as any));
    return {
      valid: missing.length === 0,
      missing,
    };
  },
};
