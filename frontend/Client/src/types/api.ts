export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: PaginationMeta;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
