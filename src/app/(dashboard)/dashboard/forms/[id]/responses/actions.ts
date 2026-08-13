"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function removeSubmissionFiles(supabase: SupabaseClient, submissionIds: string[]) {
  if (submissionIds.length === 0) return;

  const { data: answers } = await supabase
    .from("submission_answers")
    .select("id")
    .in("submission_id", submissionIds);

  const answerIds = (answers ?? []).map((a) => a.id);
  if (answerIds.length === 0) return;

  const { data: files } = await supabase
    .from("file_uploads")
    .select("storage_path")
    .in("submission_answer_id", answerIds);

  const paths = (files ?? []).map((f) => f.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from("submission-files").remove(paths);
  }
}

function revalidateResponsePaths(formId: string) {
  revalidatePath(`/dashboard/forms/${formId}/responses`);
  revalidatePath("/dashboard/forms");
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard");
}

/** Supprime une ou plusieurs réponses précises d'un formulaire. */
export async function deleteSubmissionsAction(formId: string, submissionIds: string[]) {
  if (submissionIds.length === 0) return;
  const supabase = await createClient();

  await removeSubmissionFiles(supabase, submissionIds);

  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("form_id", formId)
    .in("id", submissionIds);
  if (error) throw error;

  revalidateResponsePaths(formId);
}

/** Supprime toutes les réponses d'un formulaire. */
export async function deleteAllSubmissionsAction(formId: string) {
  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id")
    .eq("form_id", formId);
  const submissionIds = (submissions ?? []).map((s) => s.id);
  if (submissionIds.length === 0) return;

  await removeSubmissionFiles(supabase, submissionIds);

  const { error } = await supabase.from("submissions").delete().eq("form_id", formId);
  if (error) throw error;

  revalidateResponsePaths(formId);
}
