import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { globalErrorHandler } from './middleware/error.middleware';
import { identityWorker } from './domains/identity.worker';
import { masterWorker } from './domains/master.worker';
import { operationsWorker } from './domains/operations.worker';
import { commercialWorker } from './domains/commercial.worker';
import { executionWorker } from './domains/execution.worker';
import { documentWorker } from './domains/document.worker';
import { jobsWorker } from './domains/jobs.worker';

const app = new Hono();

// CORS Middleware Configuration
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-organization-id'],
    maxAge: 86400,
}));

// API Gateway Health Check
app.get('/api/health', (c) => {
    return c.json({
        success: true,
        data: {
            service: 'Calibration Commercial Module REST API Gateway',
            runtime: 'Cloudflare Workers',
            status: 'HEALTHY',
            timestamp: new Date().toISOString()
        }
    });
});

// Domain Workers Routing
app.route('/api/jobs', jobsWorker);
app.route('/api/documents', documentWorker);
app.route('/api', identityWorker);
app.route('/api', masterWorker);
app.route('/api/master', masterWorker);
app.route('/api', operationsWorker);
app.route('/api', commercialWorker);
app.route('/api/commercial', commercialWorker);
app.route('/api', executionWorker);
app.route('/api/execution', executionWorker);

// Global Error Handler
app.onError(globalErrorHandler);

// Static assets fallback (Cloudflare Workers ASSETS binding) & 404 handler
app.notFound(async (c) => {
    if (!c.req.path.startsWith('/api')) {
        if (c.env && (c.env as any).ASSETS) {
            try {
                const assetResponse = await (c.env as any).ASSETS.fetch(c.req.raw);
                if (assetResponse.status !== 404) {
                    return assetResponse;
                }
                // SPA client route fallback: serve index.html
                const indexUrl = new URL('/', c.req.url);
                return await (c.env as any).ASSETS.fetch(new Request(indexUrl.toString(), c.req.raw));
            } catch {
                return c.redirect('/', 302);
            }
        }
        return c.redirect('/', 302);
    }
    return c.json({
        success: false,
        error: {
            code: 'RESOURCE_NOT_FOUND',
            message: `Route '${c.req.path}' not found on API Gateway`
        }
    }, 404);
});

export default app;
