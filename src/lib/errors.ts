export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly provider: string,
    public readonly retryAfterMs: number = 60_000,
  ) {
    super(`Rate limit exceeded for ${provider}`);
    this.name = 'RateLimitError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ─── NEW in Phase 3 ──────────────────────────────────────────────────────────

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}