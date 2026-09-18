import { serve } from '@hono/node-server';
import app from './gateway';

const PORT = 3001;

console.log(`🚀 CCM Client API Server starting on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT
});
