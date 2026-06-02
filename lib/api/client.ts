/** Browser helper for calling the /api/v1 endpoints with the shared envelope. */

import type { ErrorCode } from "./errors";

export class ApiClientError extends Error {
  code: ErrorCode | "network_error";
  details?: unknown;
  constructor(
    code: ApiClientError["code"],
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (e) {
    throw new ApiClientError("network_error", "Network request failed", e);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || "error" in body) {
    const err = body?.error;
    throw new ApiClientError(
      err?.code ?? "internal_error",
      err?.message ?? `Request failed (${res.status})`,
      err?.details,
    );
  }
  return body.data as T;
}
