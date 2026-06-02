import type { DbClient } from "@/lib/db/client";
import type { ReportInput } from "@/lib/validation/connect";

/** File a report for moderation (admin reviews the queue). */
export async function submitReport(
  supabase: DbClient,
  reporterId: string,
  input: ReportInput,
): Promise<{ id: string; status: string }> {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: reporterId,
      subject_type: input.subject_type,
      subject_id: input.subject_id,
      reason: input.reason,
      detail: input.detail ?? null,
    })
    .select("id, status")
    .single();
  if (error) throw error;
  return data as unknown as { id: string; status: string };
}
