import type { Response } from 'express';

import type { ApiResponse, PaginationMeta } from '@repo/types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
): void {
  const body: ApiResponse<T> = { success: true, data, meta };
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): void {
  const meta: PaginationMeta = {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
  sendSuccess(res, data, 200, meta);
}
