interface ErrorPayload {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
}

interface SuccessPayload<T> {
  success: true;
  data: T;
  timestamp: number;
}

export function createErrorResponse(
  message: string,
  status: number,
  details?: unknown,
): Response {
  const body: ErrorPayload = {
    success: false,
    error: { message, ...(details !== undefined ? { details } : {}) },
  };
  return Response.json(body, { status });
}

export function createSuccessResponse<T>(data: T, status = 200): Response {
  const body: SuccessPayload<T> = {
    success: true,
    data,
    timestamp: Date.now(),
  };
  return Response.json(body, { status });
}