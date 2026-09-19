import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Edit,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  User,
  Hash,
  CreditCard,
  Shield,
  RotateCcw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { formatPaymentTerms } from '../../schemas/clientSchema';

export const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  useEffect(() => {
    if (id) {
      loadClientData(id);
    }
  }, [id]);

  const loadClientData = async (clientId: string) => {
    setLoading(true);
    try {
      const response = await clientService.getClient(clientId, true);
      setClient(response.client);
    } catch (error: any) {
      showToast(error.message || 'Failed to load client details', 'error');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: 'ACTIVE' | 'INACTIVE') => {
    setNewStatus(status);
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!client || !id) return;
    
    setStatusLoading(true);
    try {
      const updatedClient = await clientService.updateClientStatus(id, newStatus);
      setClient(updatedClient);
      setShowStatusConfirm(false);
      
      const message = newStatus === 'ACTIVE' 
        ? 'Client activated successfully'
        : 'Client deactivated successfully';
      showToast(message, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update client status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Client not found</h3>
        <button
          onClick={() => navigate('/clients')}
          className="text-blue-600 hover:text-blue-700"
        >
          Return to client list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              {client.clientName}
              <StatusBadge 
                status={client.status}
              />
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Client Code: <span className="font-mono font-semibold text-blue-700">{client.clientCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Toggle Button */}
          {client.status === 'ACTIVE' ? (
            <button
              onClick={() => handleStatusChange('INACTIVE')}
              disabled={statusLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={statusLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Activate
            </button>
          )}

          <button
            onClick={() => navigate(`/clients/${client.id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4" />
            Edit Client
          </button>
        </div>
      </div>

      {/* Client Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client Code</label>
              <p className="text-sm font-mono font-semibold text-gray-900 mt-1">{client.clientCode}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</label>
              <p className="text-sm text-gray-900 mt-1">{client.clientName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                <div className="mt-1">
                  <StatusBadge 
                    status={client.status}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</label>
                <p className="text-sm text-gray-900 mt-1">{formatPaymentTerms(client.paymentTerms)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</label>
              <p className="text-sm text-gray-900 mt-1">{client.contactPerson}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone
              </label>
              <a 
                href={`tel:${client.phone}`}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1 block"
              >
                {client.phone}
              </a>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <a 
                href={`mailto:${client.email}`}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1 block"
              >
                {client.email}
              </a>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Address Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Registered Address</label>
              <p className="text-sm text-gray-900 mt-1">{client.registeredAddress}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Address</label>
              <p className="text-sm text-gray-900 mt-1">
                {client.billingAddress === client.registeredAddress 
                  ? <span className="text-gray-500 italic">Same as registered address</span>
                  : client.billingAddress
                }
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">City</label>
                <p className="text-sm text-gray-900 mt-1">{client.city}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">State</label>
                <p className="text-sm text-gray-900 mt-1">{client.state}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">PIN Code</label>
                <p className="text-sm font-mono text-gray-900 mt-1">{client.pinCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tax Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN / Tax ID</label>
              <p className="text-sm font-mono font-semibold text-gray-900 mt-1">{client.gstinTaxId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Audit Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</label>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-900">
                {new Date(client.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {client.createdBy && (
                <p className="text-xs text-gray-500">Created by: {client.createdBy}</p>
              )}
            </div>
          </div>
          
          {client.modifiedAt && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</label>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-900">
                  {new Date(client.modifiedAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {client.modifiedBy && (
                  <p className="text-xs text-gray-500">Modified by: {client.modifiedBy}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Client History</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Requests */}
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Requests</h3>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">No requests yet</p>
          </div>
          
          {/* Quotations */}
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Quotations</h3>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">No quotations yet</p>
          </div>
          
          {/* Invoices */}
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Invoices</h3>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">No invoices yet</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Client history will be populated when request, quotation, and invoice modules are implemented.
          </p>
        </div>
      </div>

      {/* Status Confirmation Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Status Change
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {newStatus === 'ACTIVE' ? 'activate' : 'deactivate'} this client?
              {newStatus === 'INACTIVE' && (
                <span className="block mt-2 text-amber-600">
                  Deactivated clients will not appear in selection lists for new requests.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStatusConfirm(false)}
                disabled={statusLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={statusLoading}
                className={`px-4 py-2 text-white rounded-lg ${
                  newStatus === 'ACTIVE'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {statusLoading ? 'Processing...' : `${newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} Client`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};