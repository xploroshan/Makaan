import { NextResponse } from "next/server";

import { ApiError, ErrorCode } from "./errors";

/**
 * Consistent response envelopes shared by every /api/v1 endpoint so that
 * web and mobile clients parse responses identically.
 */
export interface ApiMeta {
  requestId: string;
  /** Present on list endpoints using cursor pagination. */
  nextCursor?: string | null;
}

export interface SuccessEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
}

export function ok<T>(
  data: T,
  meta: Partial<ApiMeta> & { requestId: string },
  init?: ResponseInit,
): NextResponse<SuccessEnvelope<T>> {
  return NextResponse.json(
    { data, meta: { nextCursor: null, ...meta } },
    { status: 200, ...init },
  );
}

export function created<T>(
  data: T,
  meta: { requestId: string },
): NextResponse<SuccessEnvelope<T>> {
  return NextResponse.json({ data, meta }, { status: 201 });
}

export function fail(
  error: ApiError,
  requestId: string,
): NextResponse<ErrorEnvelope> {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: { requestId },
    },
    { status: error.status },
  );
}
