/**
 * Opaque cursor for keyset pagination. We encode the sort key of the last
 * row (a timestamp + id tiebreaker) so the next page is a stable continuation.
 */
export interface Cursor {
  ts: string;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as Cursor).ts === "string" &&
      typeof (parsed as Cursor).id === "string"
    ) {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
}
