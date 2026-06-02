import { apiHandler } from "@/lib/api/handler";
import { ok } from "@/lib/api/envelope";

/** Liveness/health probe. Unauthenticated. */
export const GET = apiHandler(async ({ requestId }) => {
  return ok(
    {
      status: "ok",
      service: "dwello-api",
      version: "v1",
      time: new Date().toISOString(),
    },
    { requestId },
  );
});
