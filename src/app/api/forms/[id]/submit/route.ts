import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { sanitizeAnswersToVisibleFields } from "@/lib/conditions/engine";
import { buildFormSchema } from "@/lib/validation/field-schemas";
import type { LocationAnswer } from "@/types/submission";

// Rate limiting basique en mémoire (compatible free tier, sans service payant).
// Limite : 5 soumissions / IP / formulaire / 10 minutes.
const submissionLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (submissionLog.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  submissionLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: publicSlug } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, status, published_version_id")
    .eq("public_slug", publicSlug)
    .single();

  if (!form || form.status !== "published" || !form.published_version_id) {
    return NextResponse.json({ error: "هذا النموذج غير متاح حالياً" }, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitKey = `${form.id}:${ip}`;
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: "لقد تجاوزت الحد المسموح به من المحاولات، الرجاء المحاولة لاحقاً" },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let rawAnswers: Record<string, unknown>;
  const filesByField = new Map<string, File>();

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const answersJson = formData.get("answers");
      rawAnswers = answersJson ? JSON.parse(String(answersJson)) : {};

      for (const [key, value] of formData.entries()) {
        if (key.startsWith("file:") && value instanceof File) {
          filesByField.set(key.replace("file:", ""), value);
        }
      }
    } else {
      const body = await request.json();
      rawAnswers = body.answers ?? {};
    }
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!rawAnswers || typeof rawAnswers !== "object") {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { fields, conditions } = await loadFullVersion(supabase, form.published_version_id);

  // Injecte un placeholder pour les champs fichier afin que la validation Zod passe,
  // le fichier réel est traité séparément après validation.
  for (const [fieldId, file] of filesByField) {
    rawAnswers[fieldId] = { name: file.name, size: file.size, type: file.type };
  }

  // Défense en profondeur : ne garder que les réponses aux champs visibles
  const sanitized = sanitizeAnswersToVisibleFields(rawAnswers, fields, conditions);

  // Validation stricte côté serveur (ne jamais faire confiance au client)
  const schema = buildFormSchema(fields);
  const result = schema.safeParse(sanitized);
  if (!result.success) {
    return NextResponse.json(
      { error: "بيانات النموذج غير صالحة", details: result.error.flatten() },
      { status: 422 }
    );
  }

  // Validation des fichiers
  for (const [, file] of filesByField) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "حجم الملف يتجاوز الحد المسموح (10 ميجابايت)" }, { status: 422 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 422 });
    }
  }

  const ipHash = createHash("sha256").update(ip).digest("hex");

  // Généré côté serveur plutôt que relu via `.select()` après insertion : la table
  // submissions n'a volontairement aucune policy de lecture publique (RLS), donc
  // demander le RETURNING de l'insert échouerait pour un visiteur anonyme.
  const submissionId = randomUUID();
  const { error: submissionError } = await supabase.from("submissions").insert({
    id: submissionId,
    form_id: form.id,
    form_version_id: form.published_version_id,
    ip_hash: ipHash,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  if (submissionError) {
    console.error("submit: insert submissions failed", submissionError);
    return NextResponse.json({ error: "تعذر إرسال الرد، الرجاء المحاولة مرة أخرى" }, { status: 500 });
  }

  const answerRows = Object.entries(result.data)
    .filter(([fieldId]) => !filesByField.has(fieldId))
    .map(([fieldId, value]) => {
      const field = fields.find((f) => f.id === fieldId);
      const row: {
        submission_id: string;
        field_id: string;
        value_json: unknown;
        location_lat?: number;
        location_lng?: number;
        location_accuracy?: number;
      } = {
        submission_id: submissionId,
        field_id: fieldId,
        value_json: value,
      };

      if (field?.type === "location" && value) {
        const loc = value as LocationAnswer;
        row.location_lat = loc.latitude;
        row.location_lng = loc.longitude;
        row.location_accuracy = loc.accuracy;
      }

      return row;
    });

  if (answerRows.length > 0) {
    const { error: answersError } = await supabase.from("submission_answers").insert(answerRows);
    if (answersError) {
      console.error("submit: insert submission_answers failed", answersError);
      return NextResponse.json({ error: "تعذر حفظ الإجابات" }, { status: 500 });
    }
  }

  // Upload des fichiers vers Supabase Storage (bucket privé) + enregistrement des métadonnées
  for (const [fieldId, file] of filesByField) {
    const storagePath = `${form.id}/${submissionId}/${randomUUID()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("submission-files")
      .upload(storagePath, arrayBuffer, { contentType: file.type });

    if (uploadError) continue; // ne bloque pas toute la soumission pour un fichier

    const answerId = randomUUID();
    const { error: answerError } = await supabase.from("submission_answers").insert({
      id: answerId,
      submission_id: submissionId,
      field_id: fieldId,
      value_json: { name: file.name, size: file.size, type: file.type },
    });

    if (!answerError) {
      await supabase.from("file_uploads").insert({
        submission_answer_id: answerId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    }
  }

  return NextResponse.json({ success: true, submissionId });
}
