import { PAGINATION_DEFAULTS } from '../constants';
import { PaginatedResult, PaginationParams } from '../interfaces';

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, Number(query.page) || PAGINATION_DEFAULTS.PAGE);
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, Number(query.limit) || PAGINATION_DEFAULTS.LIMIT),
  );
  return { page, limit };
}

export function buildPaginatedResult<T>(
  items: T[],
  totalItems: number,
  { page, limit }: PaginationParams,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
