import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { formatAnswerValue } from "@/lib/utils/format";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = await params;
  const supabase = await createClient();

  const dateFrom = request.nextUrl.searchParams.get("from");
  const dateTo = request.nextUrl.searchParams.get("to");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", formId)
    .eq("owner_id", user.id)
    .single();

  if (!form) {
    return NextResponse.json({ error: "النموذج غير موجود" }, { status: 404 });
  }

  const versionIds = new Set<string>();
  if (form.current_version_id) versionIds.add(form.current_version_id);
  if (form.published_version_id) versionIds.add(form.published_version_id);

  const fieldsMap = new Map<string, Awaited<ReturnType<typeof loadFullVersion>>["fields"][number]>();
  for (const versionId of versionIds) {
    const { fields } = await loadFullVersion(supabase, versionId);
    for (const f of fields) fieldsMap.set(f.id, f);
  }
  const fields = [...fieldsMap.values()].sort((a, b) => a.order_index - b.order_index);
  const hasLocationField = fields.some((f) => f.type === "location");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الردود", { views: [{ rightToLeft: true }] });

  const columns = [
    { header: "ID", key: "id", width: 12 },
    { header: "تاريخ الإرسال", key: "submitted_at", width: 20 },
    ...fields.map((f) => ({ header: f.label, key: f.id, width: 24 })),
  ];
  if (hasLocationField) {
    columns.push(
      { header: "خط العرض", key: "lat", width: 14 },
      { header: "خط الطول", key: "lng", width: 14 },
      { header: "دقة الموقع (م)", key: "accuracy", width: 14 }
    );
  }
  sheet.columns = columns;

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  sheet.getRow(1).height = 24;

  // Pagination par lots de 500 pour rester dans les limites mémoire du free tier
  const BATCH_SIZE = 500;
  let offset = 0;

  while (true) {
    let query = supabase
      .from("submissions")
      .select("id, submitted_at")
      .eq("form_id", formId)
      .order("submitted_at", { ascending: false });

    if (dateFrom) query = query.gte("submitted_at", dateFrom);
    if (dateTo) query = query.lte("submitted_at", dateTo);

    const { data: submissions } = await query.range(offset, offset + BATCH_SIZE - 1);

    if (!submissions || submissions.length === 0) break;

    const submissionIds = submissions.map((s) => s.id);
    const { data: answers } = await supabase
      .from("submission_answers")
      .select("submission_id, field_id, value_json, location_lat, location_lng, location_accuracy")
      .in("submission_id", submissionIds);

    const answersBySubmission = new Map<string, typeof answers>();
    for (const a of answers ?? []) {
      if (!answersBySubmission.has(a.submission_id)) answersBySubmission.set(a.submission_id, []);
      answersBySubmission.get(a.submission_id)!.push(a);
    }

    for (const submission of submissions) {
      const submissionAnswers = answersBySubmission.get(submission.id) ?? [];
      const rowData: Record<string, unknown> = {
        id: submission.id.slice(0, 8),
        submitted_at: new Date(submission.submitted_at).toLocaleString("ar-MA"),
      };

      let locRow: { lat?: number; lng?: number; accuracy?: number } = {};

      for (const answer of submissionAnswers) {
        const field = fieldsMap.get(answer.field_id);
        rowData[answer.field_id] = formatAnswerValue(answer.value_json, field?.type);
        if (answer.location_lat !== null && answer.location_lat !== undefined) {
          locRow = {
            lat: answer.location_lat,
            lng: answer.location_lng ?? undefined,
            accuracy: answer.location_accuracy ?? undefined,
          };
        }
      }

      if (hasLocationField) {
        rowData.lat = locRow.lat ?? "";
        rowData.lng = locRow.lng ?? "";
        rowData.accuracy = locRow.accuracy ?? "";
      }

      sheet.addRow(rowData);
    }

    offset += BATCH_SIZE;
    if (submissions.length < BATCH_SIZE) break;
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(form.title)}-responses.xlsx"`,
    },
  });
}
