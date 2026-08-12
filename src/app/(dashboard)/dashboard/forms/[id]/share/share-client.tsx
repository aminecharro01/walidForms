"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, ExternalLink, CheckCheck, ArrowRight, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function ShareClient({ formTitle, publicUrl }: { formTitle: string; publicUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, { width: 280, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }).then(
      setQrDataUrl
    );
  }, [publicUrl]);

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link href={`/dashboard/forms`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowRight className="h-4 w-4" /> رجوع
      </Link>

      <div className="mb-6 text-center">
        <h1 className="font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
          مشاركة النموذج
        </h1>
        <p className="mt-1 text-sm text-slate-500">{formTitle}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center p-6 sm:p-8">
          <p className="mb-3 text-sm font-medium text-slate-600">رابط النموذج</p>
          <div className="flex w-full items-center gap-2">
            <Input value={publicUrl} readOnly dir="ltr" className="text-xs" />
            <Button variant="outline" size="icon" onClick={handleCopy} aria-label="نسخ الرابط">
              {copied ? <CheckCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-6 flex w-full gap-3">
            <a href={publicUrl} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4" /> فتح النموذج
              </Button>
            </a>
            <Button className="flex-1" onClick={handleCopy}>
              <Copy className="h-4 w-4" /> {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
          </div>

          <div className="mt-8 flex flex-col items-center border-t border-slate-100 pt-6">
            <p className="mb-3 text-sm font-medium text-slate-600">رمز QR</p>
            {qrDataUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code" className="rounded-xl border border-slate-200" />
                <a href={qrDataUrl} download={`qr-${formTitle}.png`} className="mt-3">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" /> تحميل الرمز
                  </Button>
                </a>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
