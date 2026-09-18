import { PaginationMeta } from '../types/api';

export interface PaginationQuery {
    page: number;
    limit: number;
    offset: number;
}

export function parsePaginationParams(query: Record<string, string | undefined>): PaginationQuery {
    let page = parseInt(query.page || '1', 10);
    let limit = parseInt(query.limit || '20', 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
    };
}
