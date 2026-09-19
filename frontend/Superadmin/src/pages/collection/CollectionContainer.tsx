import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useClients, useItems } from '../../hooks';
import { useCreateRequest } from '../../hooks';
import { useCreateQuotation } from '../../hooks';
import { useUpdateRequestStatus } from '../../hooks';
import { useNotification } from '../../context/NotificationContext';
import { RequestPriority } from '../../types/request';
import { CollectionPresenter } from './CollectionPresenter';

interface RequestDraftItem {
  tempId: string;
  itemId: string;
  serialNumber: string;
  quantity: number;
  itemAvailable: 'YES' | 'NO';
  availabilityRemarks?: string;
}

export const CollectionContainer: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useNotification();

  // ─── Server State ──────────────────────────────────────────────────────────
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: itemsData, isLoading: itemsLoading } = useItems();

  const clientsList = clientsData ?? [];
  const itemsList = itemsData ?? [];

  const isLoading = clientsLoading || itemsLoading;

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createRequest = useCreateRequest();
  const createQuotation = useCreateQuotation();
  const updateRequestStatus = useUpdateRequestStatus();

  // ─── Form State ────────────────────────────────────────────────────────────
  const [clientId, setClientId] = useState('');
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<RequestPriority>('NORMAL');
  const [remarks, setRemarks] = useState('');

  // Item selector states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [itemAvailable, setItemAvailable] = useState<'YES' | 'NO'>('YES');
  const [availabilityRemarks, setAvailabilityRemarks] = useState('');

  // Multi-item draft list
  const [draftItems, setDraftItems] = useState<RequestDraftItem[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // Pre-populate defaults once master data loads
  useEffect(() => {
    if (clientsList.length > 0 && !clientId) {
      setClientId(clientsList[0].id);
    }
    if (itemsList.length > 0 && !selectedItemId) {
      setSelectedItemId(itemsList[0].id);
      if (draftItems.length === 0) {
        setDraftItems([
          {
            tempId: 'draft-1',
            itemId: itemsList[0].id,
            serialNumber: 'SN-CAL-881',
            quantity: 1,
            itemAvailable: 'YES',
          },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientsList, itemsList]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddItem = () => {
    if (!serialNumber.trim()) {
      showToast('Please enter the serial number of the collected gauge', 'warning');
      return;
    }
    if (itemAvailable === 'NO' && !availabilityRemarks.trim()) {
      showToast(
        'Availability remarks are mandatory when marked unavailable (NO)',
        'warning'
      );
      return;
    }

    const newItem: RequestDraftItem = {
      tempId: `draft-${Date.now()}`,
      itemId: selectedItemId,
      serialNumber,
      quantity,
      itemAvailable,
      availabilityRemarks,
    };

    setDraftItems((prev) => [...prev, newItem]);
    setSerialNumber('');
    setQuantity(1);
    setItemAvailable('YES');
    setAvailabilityRemarks('');
    showToast('Item added to collection list', 'info');
  };

  const handleRemoveItem = (tempId: string) => {
    setDraftItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleSubmit = async () => {
    if (draftItems.length === 0) {
      showToast(
        'At least one item must be included in the collection request',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createRequest.mutateAsync({
        clientId,
        collectionDate,
        priority,
        remarks,
        items: draftItems.map((d) => ({
          itemId: d.itemId,
          serialNumber: d.serialNumber,
          quantity: d.quantity,
          itemAvailable: d.itemAvailable,
          availabilityRemarks: d.availabilityRemarks,
        })),
      });

      // Extra invalidation as required
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests'] });

      showToast(
        `Calibration Request ${created.requestNumber} logged successfully!`,
        'success'
      );
      navigate(`/requests/${created.id}`);
    } catch {
      showToast('Failed to create request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseQuotation = async () => {
    if (!clientId) {
      showToast('Please select a client entity first', 'warning');
      return;
    }
    if (draftItems.length === 0) {
      showToast(
        'At least one item must be included to raise a quotation',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the base calibration request
      const created = await createRequest.mutateAsync({
        clientId,
        collectionDate,
        priority,
        remarks: remarks
          ? `${remarks} (Direct Quotation Raised)`
          : 'Quotation raised directly from request intake form',
        items: draftItems.map((d) => ({
          itemId: d.itemId,
          serialNumber: d.serialNumber,
          quantity: d.quantity,
          itemAvailable: d.itemAvailable,
          availabilityRemarks: d.availabilityRemarks,
        })),
      });

      // Extra invalidation as required
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests'] });

      // 2. Map items with standard pricing and tax for the quotation
      const quotationItems = draftItems.map((d) => {
        const itemObj = itemsList.find((i) => i.id === d.itemId);
        return {
          itemId: d.itemId,
          itemName: itemObj?.itemName || 'Calibrated Instrument',
          itemCode: itemObj?.itemCode || 'ITM-001',
          description: `Calibration service for ${itemObj?.itemName || 'Instrument'} (SN: ${d.serialNumber})`,
          standardCost: itemObj?.standardCost || 1200,
          quantity: d.quantity,
          taxRate: 18,
        };
      });

      // 3. Create the commercial quotation
      const quotation = await createQuotation.mutateAsync({
        clientId,
        requestId: created.id,
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        currency: 'INR',
        discountAmount: 0,
        remarks: `Quotation raised directly from Request Form for ${created.requestNumber}`,
        items: quotationItems,
      });

      // 4. Update request status to QUOTATION
      await updateRequestStatus.mutateAsync({
        id: created.id,
        status: 'QUOTATION',
        remarks: `Quotation ${quotation.quotationNumber} raised`,
      });

      showToast(
        `Quotation ${quotation.quotationNumber} raised successfully for Request ${created.requestNumber}!`,
        'success'
      );
      navigate(`/requests/${created.id}?tab=commercial`);
    } catch (err) {
      console.error(err);
      showToast('Failed to raise quotation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CollectionPresenter
      isLoading={isLoading}
      // Data
      clientsList={clientsList}
      itemsList={itemsList}
      // Form state
      clientId={clientId}
      collectionDate={collectionDate}
      priority={priority}
      remarks={remarks}
      selectedItemId={selectedItemId}
      serialNumber={serialNumber}
      quantity={quantity}
      itemAvailable={itemAvailable}
      availabilityRemarks={availabilityRemarks}
      draftItems={draftItems}
      submitting={submitting}
      // Setters
      onClientIdChange={setClientId}
      onCollectionDateChange={setCollectionDate}
      onPriorityChange={setPriority}
      onRemarksChange={setRemarks}
      onSelectedItemIdChange={setSelectedItemId}
      onSerialNumberChange={setSerialNumber}
      onQuantityChange={setQuantity}
      onItemAvailableChange={setItemAvailable}
      onAvailabilityRemarksChange={setAvailabilityRemarks}
      // Handlers
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onSubmit={handleSubmit}
      onRaiseQuotation={handleRaiseQuotation}
      onCancel={() => navigate('/requests')}
    />
  );
};
