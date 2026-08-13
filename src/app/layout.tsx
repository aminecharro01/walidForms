import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getServerLocale } from "@/lib/i18n/server";
import { dirFor } from "@/lib/i18n/dictionaries";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "WalidForms | إنشاء وجمع البيانات",
  description:
    "منصة حديثة لإنشاء النماذج ونشرها وجمع البيانات الميدانية مع دعم الموقع الجغرافي والمنطق الشرطي.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-[family-name:var(--font-tajawal)] text-slate-900">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
