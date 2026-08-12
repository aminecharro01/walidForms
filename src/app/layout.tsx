import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
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
  title: "منصة النماذج | إنشاء وجمع البيانات",
  description:
    "منصة حديثة لإنشاء النماذج ونشرها وجمع البيانات الميدانية مع دعم الموقع الجغرافي والمنطق الشرطي.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-[family-name:var(--font-tajawal)] text-slate-900">
        {children}
      </body>
    </html>
  );
}
