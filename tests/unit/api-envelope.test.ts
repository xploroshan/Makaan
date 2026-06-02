import { describe, expect, it } from "vitest";

import { ok, created, fail } from "@/lib/api/envelope";
import { ApiError, ErrorCode } from "@/lib/api/errors";

describe("api envelope", () => {
  it("wraps success data with meta", async () => {
    const res = ok({ hello: "world" }, { requestId: "req-1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      data: { hello: "world" },
      meta: { requestId: "req-1", nextCursor: null },
    });
  });

  it("returns 201 for created", async () => {
    const res = created({ id: "abc" }, { requestId: "req-2" });
    expect(res.status).toBe(201);
  });

  it("renders ApiError as an error envelope with the right status", async () => {
    const res = fail(ApiError.notFound("nope"), "req-3");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(body.error.message).toBe("nope");
    expect(body.meta.requestId).toBe("req-3");
  });
});

describe("ApiError", () => {
  it("maps codes to HTTP statuses", () => {
    expect(ApiError.unauthenticated().status).toBe(401);
    expect(ApiError.forbidden().status).toBe(403);
    expect(ApiError.validation().status).toBe(422);
    expect(new ApiError(ErrorCode.CONFLICT, "x").status).toBe(409);
  });
});
