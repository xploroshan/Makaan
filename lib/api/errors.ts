/**
 * Canonical, machine-readable error codes for the Dwello API.
 * Mobile and web clients switch on `code`, never on the human message.
 */
export const ErrorCode = {
  VALIDATION: "validation_error",
  UNAUTHENTICATED: "unauthenticated",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limited",
  IDEMPOTENCY_CONFLICT: "idempotency_conflict",
  INTERNAL: "internal_error",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION]: 422,
  [ErrorCode.UNAUTHENTICATED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.IDEMPOTENCY_CONFLICT]: 409,
  [ErrorCode.INTERNAL]: 500,
};

/** A thrown ApiError is caught by `apiHandler` and rendered as an error envelope. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static unauthenticated(message = "Authentication required") {
    return new ApiError(ErrorCode.UNAUTHENTICATED, message);
  }
  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(ErrorCode.FORBIDDEN, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(ErrorCode.NOT_FOUND, message);
  }
  static conflict(message = "Resource conflict") {
    return new ApiError(ErrorCode.CONFLICT, message);
  }
  static validation(message = "Request failed validation", details?: unknown) {
    return new ApiError(ErrorCode.VALIDATION, message, details);
  }
}
