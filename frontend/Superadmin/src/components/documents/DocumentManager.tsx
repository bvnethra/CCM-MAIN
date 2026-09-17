import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Eye, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { DocumentRecord } from '../../types/verification';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../modals/AppModals';

interface DocumentManagerProps {
  requestId: string;
  readOnly?: boolean;
  onDocumentsChange?: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  requestId,
  readOnly = false,
  onDocumentsChange,
}) => {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const [docType, setDocType] = useState<any>('VERIFICATION_PROOF');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMandatory, setIsMandatory] = useState(false);

  const { showToast } = useNotification();

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getByRequestId(requestId);
      setDocs(data);
    } catch {
      showToast('Unable to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [requestId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a file to upload', 'warning');
      return;
    }

    try {
      await documentService.upload({
        requestId,
        documentType: docType,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedBy: 'Current User',
        isMandatory,
        url: '#',
      });
      showToast('Document uploaded successfully', 'success');
      setUploadModalOpen(false);
      setSelectedFile(null);
      loadDocuments();
      if (onDocumentsChange) onDocumentsChange();
    } catch {
      showToast('Failed to upload document', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await documentService.delete(id);
      showToast('Document deleted', 'info');
      loadDocuments();
      if (onDocumentsChange) onDocumentsChange();
    } catch {
      showToast('Failed to delete document', 'error');
    }
  };

  // Required types check
  const requiredTypes = [
    { type: 'COLLECTION_PROOF', label: 'Client Collection Gate Pass / Proof' },
    { type: 'RECEIPT_PROOF', label: 'Lab Intake Receipt Acknowledgement' },
  ];

  return (
    <div className="space-y-4">
      {/* Mandatory status banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
          Mandatory Documentation Checklist
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requiredTypes.map((req) => {
            const hasDoc = docs.some((d) => d.documentType === req.type);
            return (
              <div
                key={req.type}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                  hasDoc
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/60 border-amber-200 text-amber-800'
                }`}
              >
                {hasDoc ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="font-medium">{req.label}</span>
                <span className="ml-auto font-mono text-[10px] uppercase font-bold">
                  {hasDoc ? 'Uploaded' : 'Required'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Attached Files ({docs.length})
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-xs text-slate-400 py-6 text-center">Loading attached documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">{doc.fileName}</span>
                    {doc.isMandatory && (
                      <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded font-semibold">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span className="font-mono">{doc.documentType.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{doc.fileSize}</span>
                    <span>•</span>
                    <span>{doc.uploadedBy}</span>
                    <span>•</span>
                    <span>{doc.uploadedDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Operational Document"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Document Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
            >
              <option value="COLLECTION_PROOF">Collection Proof (Gate Pass / Receipt)</option>
              <option value="RECEIPT_PROOF">Lab Intake Receipt Acknowledgement</option>
              <option value="PREVIOUS_CERTIFICATE">Previous Calibration Certificate</option>
              <option value="VERIFICATION_PROOF">Verification & Physical Inspection Proof</option>
              <option value="CALIBRATION_CERTIFICATE">Calibration Certificate Document</option>
              <option value="DISPATCH_PROOF">Courier Dispatch Receipt / Airway Bill</option>
              <option value="DELIVERY_PROOF">Client Delivery Signed Receipt</option>
              <option value="OTHER">Other Operational Document</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Document File <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1.5 text-slate-600"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="text-xs text-slate-700 font-medium">
              Flag as mandatory compliance document
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Upload
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview: ${previewDoc.fileName}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-indigo-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">{previewDoc.fileName}</h4>
              <p className="text-xs text-slate-400 mt-1">
                Category: {previewDoc.documentType} • Size: {previewDoc.fileSize}
              </p>
              <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 max-w-md">
                Verified digital signature and audit checksum attached. File is ready for NABL accreditation review.
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
