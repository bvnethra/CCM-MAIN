import { serve } from '@hono/node-server';
import app from './gateway';
import dotenv from 'dotenv';

dotenv.config();

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 Starting Calibration Commercial Module REST API Gateway on http://localhost:${port}`);
serve({
    fetch: app.fetch,
    port
});
