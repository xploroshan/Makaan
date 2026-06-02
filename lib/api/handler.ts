import { randomUUID } from "node:crypto";

import type { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { fail } from "./envelope";
import { ApiError, ErrorCode } from "./errors";

export interface ApiContext<P = Record<string, string>> {
  req: NextRequest;
  /** Route params (already awaited for Next 16 async params). */
  params: P;
  requestId: string;
  /** Idempotency-Key header value for write requests, if provided. */
  idempotencyKey: string | null;
}

type Handler<P> = (ctx: ApiContext<P>) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an /api/v1 route handler with: request-id assignment, uniform error
 * rendering (ApiError + ZodError -> error envelope), and idempotency-key
 * extraction. Keeps every endpoint terse and consistent.
 */
export function apiHandler<P = Record<string, string>>(handler: Handler<P>) {
  return async (
    req: NextRequest,
    segment: { params: Promise<P> },
  ): Promise<NextResponse> => {
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    try {
      const params = segment?.params ? await segment.params : ({} as P);
      const idempotencyKey = req.headers.get("idempotency-key");
      return await handler({ req, params, requestId, idempotencyKey });
    } catch (err) {
      return renderError(err, requestId);
    }
  };
}

function renderError(err: unknown, requestId: string): NextResponse {
  if (err instanceof ApiError) {
    return fail(err, requestId);
  }
  if (err instanceof ZodError) {
    return fail(
      ApiError.validation("Request failed validation", err.flatten()),
      requestId,
    );
  }
  // Never leak internals to the client.
  console.error(`[api] unhandled error (request ${requestId})`, err);
  return fail(
    new ApiError(ErrorCode.INTERNAL, "Something went wrong"),
    requestId,
  );
}

/** Parse + validate a JSON request body, throwing a ZodError on failure. */
export async function parseJson<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw ApiError.validation("Request body must be valid JSON");
  }
  return schema.parse(raw);
}

/** Parse + validate URL search params against a schema. */
export function parseQuery<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
): z.infer<S> {
  const obj = Object.fromEntries(req.nextUrl.searchParams.entries());
  return schema.parse(obj);
}
