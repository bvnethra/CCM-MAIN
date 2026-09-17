import { SignJWT } from 'jose';

const DEFAULT_SECRET = 'super-secret-jwt-key-for-calibration-commercial-module-testing';

export async function createJwtForRole(role: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(DEFAULT_SECRET);
  let userId = '00000000-0000-0000-0000-000000000001';
  let permissions = ['*'];

  if (role === 'COLLECTION_AGENT') {
    userId = '00000000-0000-0000-0000-000000000002';
    permissions = ['CLIENT_VIEW', 'VENDOR_VIEW', 'ITEM_MASTER_VIEW', 'REQUEST_VIEW', 'REQUEST_CREATE', 'COLLECTION_UPDATE'];
  } else if (role === 'LAB_USER') {
    userId = '00000000-0000-0000-0000-000000000003';
    permissions = ['CLIENT_VIEW', 'VENDOR_VIEW', 'ITEM_MASTER_VIEW', 'REQUEST_VIEW', 'LAB_VIEW', 'VERIFICATION_UPDATE', 'CALIBRATION_VIEW', 'CALIBRATION_UPDATE', 'CERTIFICATE_GENERATE', 'DOCUMENT_VIEW'];
  } else if (role === 'COMMERCIAL_USER') {
    userId = '00000000-0000-0000-0000-000000000004';
    permissions = ['CLIENT_VIEW', 'VENDOR_VIEW', 'ITEM_MASTER_VIEW', 'REQUEST_VIEW', 'QUOTATION_VIEW', 'QUOTATION_CREATE', 'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_ISSUE', 'PO_VIEW', 'PO_CREATE', 'DOCUMENT_VIEW'];
  } else if (role === 'APPROVER') {
    userId = '00000000-0000-0000-0000-000000000005';
    permissions = ['CLIENT_VIEW', 'VENDOR_VIEW', 'ITEM_MASTER_VIEW', 'REQUEST_VIEW', 'QUOTATION_VIEW', 'QUOTATION_APPROVE'];
  } else if (role === 'DISPATCH_USER') {
    userId = '00000000-0000-0000-0000-000000000006';
    permissions = ['CLIENT_VIEW', 'VENDOR_VIEW', 'ITEM_MASTER_VIEW', 'REQUEST_VIEW', 'SIGNATURE_CREATE', 'DISPATCH_VIEW', 'DISPATCH_CREATE', 'DELIVERY_VIEW', 'DELIVERY_UPDATE'];
  }

  return await new SignJWT({
    sub: userId,
    userId,
    tenant_id: '00000000-0000-0000-0000-000000000001',
    organization_id: '00000000-0000-0000-0000-000000000001',
    email,
    roles: [role],
    permissions
  })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);
}
