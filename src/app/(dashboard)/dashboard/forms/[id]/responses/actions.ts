"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { chunk } from "@/lib/utils/chunk";
import { fetchAllInBatches, FETCH_PAGE_SIZE } from "@/lib/supabase/fetch-in-batches";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const IN_CHUNK_SIZE = 150;

async function removeSubmissionFiles(supabase: SupabaseClient, submissionIds: string[]) {
  if (submissionIds.length === 0) return;

  const { rows: answerRows, batchErrors: answerErrors } = await fetchAllInBatches<{ id: string }>(
    submissionIds,
    async (idsBatch, offset) =>
      await supabase
        .from("submission_answers")
        .select("id")
        .in("submission_id", idsBatch)
        .range(offset, offset + FETCH_PAGE_SIZE - 1)
  );
  if (answerErrors.length > 0) {
    console.error("removeSubmissionFiles: fetch submission_answers batch failed", answerErrors);
  }
  const answerIds = answerRows.map((a) => a.id);
  if (answerIds.length === 0) return;

  const { rows: fileRows, batchErrors: fileErrors } = await fetchAllInBatches<{ storage_path: string }>(
    answerIds,
    async (idsBatch, offset) =>
      await supabase
        .from("file_uploads")
        .select("storage_path")
        .in("submission_answer_id", idsBatch)
        .range(offset, offset + FETCH_PAGE_SIZE - 1)
  );
  if (fileErrors.length > 0) {
    console.error("removeSubmissionFiles: fetch file_uploads batch failed", fileErrors);
  }
  const paths = fileRows.map((f) => f.storage_path);
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

  for (const idsBatch of chunk(submissionIds, IN_CHUNK_SIZE)) {
    const { error } = await supabase.from("submissions").delete().eq("form_id", formId).in("id", idsBatch);
    if (error) throw error;
  }

  revalidateResponsePaths(formId);
}

/** Supprime toutes les réponses d'un formulaire. */
export async function deleteAllSubmissionsAction(formId: string) {
  const supabase = await createClient();

  const submissionIds: string[] = [];
  {
    let offset = 0;
    while (true) {
      const { data } = await supabase
        .from("submissions")
        .select("id")
        .eq("form_id", formId)
        .range(offset, offset + FETCH_PAGE_SIZE - 1);
      if (!data || data.length === 0) break;
      submissionIds.push(...data.map((s) => s.id));
      if (data.length < FETCH_PAGE_SIZE) break;
      offset += FETCH_PAGE_SIZE;
    }
  }
  if (submissionIds.length === 0) return;

  await removeSubmissionFiles(supabase, submissionIds);

  const { error } = await supabase.from("submissions").delete().eq("form_id", formId);
  if (error) throw error;

  revalidateResponsePaths(formId);
}
