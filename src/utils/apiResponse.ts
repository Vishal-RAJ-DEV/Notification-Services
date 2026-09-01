export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendSuccess<T>(
  message: string,
  data?: T,
  meta?: ApiResponseBody['meta'],
): ApiResponseBody<T> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}
