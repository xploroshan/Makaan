import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type {
  ConfigAdminInput,
  FormTemplateAdminInput,
  GeoAdminInput,
  ModerateListingInput,
  UserAdminInput,
} from "@/lib/validation/admin";

/**
 * Super Admin operations. These run with the service-role client (RLS
 * bypassed) and MUST be called only after `requireRole("admin")`. Every
 * mutating action writes to the immutable audit log.
 */

export async function writeAudit(
  admin: DbClient,
  actorId: string,
  action: string,
  entity: string,
  entityId: string | null,
  detail?: unknown,
): Promise<void> {
  await admin.from("audit_log").insert({
    actor: actorId,
    action,
    entity,
    entity_id: entityId,
    detail: detail ?? null,
  });
}

// ---------- Platform analytics ----------------------------------------------
export interface PlatformStats {
  users: number;
  listings: { active: number; total: number };
  enquiries: number;
  pendingVerifications: number;
  openReports: number;
}

export async function getPlatformStats(
  admin: DbClient,
): Promise<PlatformStats> {
  const head = (table: string) =>
    admin.from(table).select("id", { count: "exact", head: true });

  const [users, totalListings, activeListings, enquiries, verifs, reports] =
    await Promise.all([
      head("users"),
      head("listings"),
      admin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      head("enquiries"),
      admin
        .from("verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  return {
    users: users.count ?? 0,
    listings: {
      active: activeListings.count ?? 0,
      total: totalListings.count ?? 0,
    },
    enquiries: enquiries.count ?? 0,
    pendingVerifications: verifs.count ?? 0,
    openReports: reports.count ?? 0,
  };
}

// ---------- Users & roles ----------------------------------------------------
export async function listUsers(admin: DbClient, q?: string) {
  let query = admin
    .from("users")
    .select("id, name, email, phone, roles, status, trust_score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateUser(
  admin: DbClient,
  actorId: string,
  userId: string,
  input: UserAdminInput,
) {
  const patch: Record<string, unknown> = {};
  if (input.status) patch.status = input.status;
  if (input.roles) patch.roles = input.roles;
  const { data, error } = await admin
    .from("users")
    .update(patch)
    .eq("id", userId)
    .select("id, name, roles, status")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("User not found");
  await writeAudit(admin, actorId, "user.update", "user", userId, input);
  return data;
}

// ---------- Listings & moderation -------------------------------------------
export async function listListingsForModeration(
  admin: DbClient,
  status?: string,
) {
  let query = admin
    .from("listings")
    .select(
      "id, owner_id, transaction_type, property_type, status, title, price, featured, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function moderateListing(
  admin: DbClient,
  actorId: string,
  listingId: string,
  input: ModerateListingInput,
) {
  if (input.action === "remove") {
    const { error } = await admin.from("listings").delete().eq("id", listingId);
    if (error) throw error;
    await writeAudit(
      admin,
      actorId,
      "listing.remove",
      "listing",
      listingId,
      input,
    );
    return { id: listingId, removed: true };
  }

  const patch: Record<string, unknown> = {};
  switch (input.action) {
    case "approve":
      patch.status = "active";
      patch.published_at = new Date().toISOString();
      break;
    case "reject":
      patch.status = "rejected";
      break;
    case "expire":
      patch.status = "expired";
      break;
    case "pause":
      patch.status = "paused";
      break;
    case "feature":
      patch.featured = true;
      break;
    case "unfeature":
      patch.featured = false;
      break;
  }

  const { data, error } = await admin
    .from("listings")
    .update(patch)
    .eq("id", listingId)
    .select("id, status, featured")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Listing not found");
  await writeAudit(
    admin,
    actorId,
    `listing.${input.action}`,
    "listing",
    listingId,
    input,
  );
  return data;
}

// ---------- Verification queue ----------------------------------------------
export async function listVerifications(admin: DbClient, status = "pending") {
  const { data, error } = await admin
    .from("verifications")
    .select("id, user_id, listing_id, type, status, evidence_ref, created_at")
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function reviewVerification(
  admin: DbClient,
  actorId: string,
  verificationId: string,
  decision: "verified" | "rejected",
) {
  const { data, error } = await admin
    .from("verifications")
    .update({
      status: decision,
      verified_at: decision === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", verificationId)
    .select("id, user_id, type, status")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Verification not found");
  await writeAudit(
    admin,
    actorId,
    `verification.${decision}`,
    "verification",
    verificationId,
  );
  return data;
}

export async function verifyAgent(
  admin: DbClient,
  actorId: string,
  agentId: string,
  verified: boolean,
) {
  const { data, error } = await admin
    .from("agent_profiles")
    .update({ verified })
    .eq("id", agentId)
    .select("id, verified")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Agent not found");
  await writeAudit(admin, actorId, "agent.verify", "agent", agentId, {
    verified,
  });
  return data;
}

// ---------- Reports ----------------------------------------------------------
export async function listReports(admin: DbClient, status = "open") {
  const { data, error } = await admin
    .from("reports")
    .select(
      "id, reporter_id, subject_type, subject_id, reason, detail, status, created_at",
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function updateReport(
  admin: DbClient,
  actorId: string,
  reportId: string,
  status: string,
) {
  const { data, error } = await admin
    .from("reports")
    .update({ status })
    .eq("id", reportId)
    .select("id, status")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Report not found");
  await writeAudit(admin, actorId, "report.update", "report", reportId, {
    status,
  });
  return data;
}

// ---------- Form templates ---------------------------------------------------
export async function listFormTemplates(admin: DbClient) {
  const { data, error } = await admin
    .from("form_templates")
    .select(
      "id, transaction_type, property_type, version, fields, validations, enabled, updated_at",
    )
    .order("transaction_type")
    .order("property_type");
  if (error) throw error;
  return data ?? [];
}

export async function upsertFormTemplate(
  admin: DbClient,
  actorId: string,
  input: FormTemplateAdminInput,
) {
  const { data, error } = await admin
    .from("form_templates")
    .upsert(input, { onConflict: "transaction_type,property_type,version" })
    .select("id, transaction_type, property_type, version")
    .single();
  if (error) throw error;
  await writeAudit(
    admin,
    actorId,
    "form_template.upsert",
    "form_template",
    data.id,
    {
      transaction_type: input.transaction_type,
      property_type: input.property_type,
      version: input.version,
    },
  );
  return data;
}

// ---------- Geo catalogue ----------------------------------------------------
export async function listGeo(admin: DbClient, q?: string) {
  let query = admin
    .from("geo")
    .select("id, country, city, locality, pincode, enabled, created_at")
    .order("city")
    .limit(100);
  if (q) query = query.or(`city.ilike.%${q}%,pincode.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertGeo(
  admin: DbClient,
  actorId: string,
  input: GeoAdminInput,
) {
  const row: Record<string, unknown> = {
    country: input.country,
    city: input.city,
    locality: input.locality ?? null,
    pincode: input.pincode ?? null,
    enabled: input.enabled,
  };
  if (input.lat != null && input.lng != null) {
    row.centroid = `SRID=4326;POINT(${input.lng} ${input.lat})`;
  }
  const { data, error } = await admin
    .from("geo")
    .insert(row)
    .select("id, city, locality, pincode, enabled")
    .single();
  if (error) throw error;
  await writeAudit(admin, actorId, "geo.create", "geo", data.id, input);
  return data;
}

export async function setGeoEnabled(
  admin: DbClient,
  actorId: string,
  geoId: string,
  enabled: boolean,
) {
  const { data, error } = await admin
    .from("geo")
    .update({ enabled })
    .eq("id", geoId)
    .select("id, enabled")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Geo entry not found");
  await writeAudit(admin, actorId, "geo.toggle", "geo", geoId, { enabled });
  return data;
}

// ---------- Dynamic config / feature flags / CMS -----------------------------
export async function listConfig(admin: DbClient) {
  const { data, error } = await admin
    .from("app_config")
    .select("key, value, scope, enabled, updated_at")
    .order("key");
  if (error) throw error;
  return data ?? [];
}

export async function upsertConfig(
  admin: DbClient,
  actorId: string,
  input: ConfigAdminInput,
) {
  const { data, error } = await admin
    .from("app_config")
    .upsert(
      {
        key: input.key,
        value: input.value ?? {},
        scope: input.scope,
        enabled: input.enabled,
        updated_by: actorId,
      },
      { onConflict: "key" },
    )
    .select("key, value, scope, enabled")
    .single();
  if (error) throw error;
  await writeAudit(
    admin,
    actorId,
    "config.upsert",
    "app_config",
    input.key,
    input,
  );
  return data;
}

// ---------- Audit log --------------------------------------------------------
export async function listAudit(admin: DbClient) {
  const { data, error } = await admin
    .from("audit_log")
    .select("id, actor, action, entity, entity_id, detail, at")
    .order("at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
