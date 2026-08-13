"use client";

import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  GitBranch,
  BarChart3,
  FileSpreadsheet,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkedinIcon } from "@/components/ui/linkedin-icon";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLocale } from "@/lib/i18n/locale-context";
import type { DictKey } from "@/lib/i18n/dictionaries";

const features: { icon: typeof ClipboardList; titleKey: DictKey; descKey: DictKey }[] = [
  { icon: ClipboardList, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
  { icon: MapPin, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
  { icon: GitBranch, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  { icon: BarChart3, titleKey: "landing.feature4Title", descKey: "landing.feature4Desc" },
  { icon: FileSpreadsheet, titleKey: "landing.feature5Title", descKey: "landing.feature5Desc" },
  { icon: Smartphone, titleKey: "landing.feature6Title", descKey: "landing.feature6Desc" },
];

const stepKeys: DictKey[] = ["landing.step1", "landing.step2", "landing.step3", "landing.step4", "landing.step5"];
const trustKeys: DictKey[] = ["landing.trust1", "landing.trust2", "landing.trust3"];

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ClipboardList className="h-4.5 w-4.5" />
            </div>
            <span className="font-[family-name:var(--font-cairo)] text-lg font-bold text-slate-900">
              WalidForms
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t("landing.login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">{t("landing.createAccount")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            <Zap className="h-3.5 w-3.5" /> {t("landing.badge")}
          </div>
          <h1 className="font-[family-name:var(--font-cairo)] text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            {t("landing.heroTitle1")}
            <br />
            <span className="text-brand-600">{t("landing.heroTitle2")}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-500 sm:text-lg">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                {t("landing.startFree")}
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t("landing.login")}
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-14 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {stepKeys.map((key, i) => (
              <div key={key} className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-700">
                  {t(key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900 sm:text-3xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-3 text-slate-500">{t("landing.featuresSubtitle")}</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.titleKey} className="p-6 transition-shadow hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <feature.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
                  {t(feature.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t(feature.descKey)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / free tier */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900 sm:text-2xl">
            {t("landing.trustTitle")}
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            {trustKeys.map((key) => (
              <span key={key} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t(key)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-brand-600 px-6 py-14 text-center sm:px-12">
          <h2 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-white sm:text-3xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mt-3 text-brand-100">{t("landing.ctaSubtitle")}</p>
          <Link href="/register" className="mt-7 inline-block">
            <Button size="lg" variant="secondary" className="bg-white text-brand-700 hover:bg-slate-100">
              {t("landing.ctaButton")}
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-400 sm:px-6">
        <p>
          © {new Date().getFullYear()} WalidForms. {t("landing.footerRights")}
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5">
          {t("landing.footerDev")}
          <a
            href="https://www.linkedin.com/in/charroamine/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
          >
            <LinkedinIcon className="h-3.5 w-3.5" />
            Amine Charro
          </a>
        </p>
      </footer>
    </div>
  );
}
