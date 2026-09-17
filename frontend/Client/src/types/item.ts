export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface Item {
  id: string;
  tenantId: string;
  organizationId: string;
  itemCode: string;
  itemName: string;
  itemType: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  measurementRange: string;
  leastCount: string;
  standardCost: number;
  calibrationFrequencyMonths: number;
  status: ItemStatus;
  createdAt: string;
  description?: string;
}

export interface ItemFormData {
  itemCode: string;
  itemName: string;
  itemType: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  measurementRange: string;
  leastCount: string;
  standardCost: number;
  calibrationFrequencyMonths: number;
  status: ItemStatus;
  description?: string;
}
