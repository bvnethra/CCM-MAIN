import { z } from 'zod';

export const uuidParamSchema = z.object({
    id: z.string().uuid('Invalid UUID format')
});

export const paginationQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});
