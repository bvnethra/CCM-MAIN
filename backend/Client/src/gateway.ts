import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-client-id'],
  maxAge: 86400,
}));

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    data: {
      service: 'CCM Client & Operations API Gateway',
      status: 'HEALTHY',
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/client/requests', (c) => {
  return c.json({
    success: true,
    data: [
      { id: '1', requestNumber: 'REQ-2026-081', itemName: 'Digital Vernier Caliper 0-300mm', serialNumber: 'VC-99120', status: 'IN_LAB' },
      { id: '2', requestNumber: 'REQ-2026-079', itemName: 'Micrometer Gauge 25-50mm', serialNumber: 'MG-44211', status: 'CALIBRATED' },
      { id: '3', requestNumber: 'REQ-2026-072', itemName: 'Dial Indicator 0-10mm / 0.01mm', serialNumber: 'DI-10992', status: 'DELIVERED' }
    ]
  });
});

app.get('/api/client/certificates', (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'cert-1', certNumber: 'CERT-2026-079', equipment: 'External Micrometer Gauge 25-50mm', result: 'PASS' },
      { id: 'cert-2', certNumber: 'CERT-2026-072', equipment: 'Dial Indicator 0-10mm / 0.01mm', result: 'PASS' }
    ]
  });
});

app.get('/api/client/invoices', (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'inv-1', invoiceNumber: 'INV-2026-0941', amount: 14500, status: 'PENDING' },
      { id: 'inv-2', invoiceNumber: 'INV-2026-0812', amount: 28000, status: 'PAID' }
    ]
  });
});

export default app;
