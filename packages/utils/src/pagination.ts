import type { PaginationQuery } from '@repo/types';

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function normalizePagination(query: PaginationQuery): NormalizedPagination {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function fhirPaginationParams(query: PaginationQuery): { _count: number; _offset: number } {
  const { page, pageSize } = normalizePagination(query);
  return {
    _count: pageSize,
    _offset: (page - 1) * pageSize,
  };
}
