import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShareClient } from "./share-client";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase.from("forms").select("title, public_slug, status").eq("id", id).single();
  if (!form) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicUrl = `${siteUrl}/f/${form.public_slug}`;

  return <ShareClient formTitle={form.title} publicUrl={publicUrl} />;
}
