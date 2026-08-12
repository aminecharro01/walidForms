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

const features = [
  {
    icon: ClipboardList,
    title: "منشئ نماذج بالسحب والإفلات",
    description: "أنشئ نماذج احترافية بسهولة تامة عبر واجهة بديهية للسحب والإفلات، بدون أي برمجة.",
  },
  {
    icon: MapPin,
    title: "تحديد الموقع الجغرافي",
    description: "اجمع بيانات ميدانية دقيقة مع إحداثيات GPS مباشرة من هاتف المستخدم، بموافقته الصريحة.",
  },
  {
    icon: GitBranch,
    title: "منطق شرطي متقدم",
    description: "أظهر أو أخفِ الأسئلة تلقائياً بناءً على إجابات سابقة لتجربة أكثر ذكاءً وتخصيصاً.",
  },
  {
    icon: BarChart3,
    title: "تحليلات فورية",
    description: "تابع نتائجك عبر رسوم بيانية تفاعلية وإحصائيات محدثة لحظياً.",
  },
  {
    icon: FileSpreadsheet,
    title: "تصدير إلى Excel",
    description: "صدّر جميع ردودك بضغطة واحدة إلى ملف Excel منظم بعناوين عربية واضحة.",
  },
  {
    icon: Smartphone,
    title: "تجربة سلسة على الهاتف",
    description: "نماذج مصممة أولاً للهواتف الذكية، لتجربة ملء سريعة ومريحة أينما كنت.",
  },
];

const steps = ["أنشئ", "انشر", "اجمع", "حلل", "صدّر"];

export default function LandingPage() {
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
              منصة النماذج
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">إنشاء حساب</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            <Zap className="h-3.5 w-3.5" /> منصة جمع بيانات حديثة
          </div>
          <h1 className="font-[family-name:var(--font-cairo)] text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            أنشئ نماذجك بسهولة
            <br />
            <span className="text-brand-600">واجمع البيانات من أي مكان</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-500 sm:text-lg">
            منصة عربية متكاملة لإنشاء النماذج ونشرها وجمع البيانات الميدانية، مع دعم كامل للموقع
            الجغرافي والمنطق الشرطي والتحليلات الفورية.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                ابدأ مجاناً الآن
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                تسجيل الدخول
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-14 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-700">
                  {step}
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
              كل ما تحتاجه لجمع البيانات
            </h2>
            <p className="mt-3 text-slate-500">
              أدوات قوية وسهلة الاستخدام مصممة خصيصاً لفرق جمع البيانات الميدانية
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 transition-shadow hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <feature.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / free tier */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900 sm:text-2xl">
            مبني على تقنيات موثوقة ومجانية
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            {["خصوصية بياناتك محمية", "بدون رسوم خفية", "أمان على مستوى المؤسسات"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-brand-600 px-6 py-14 text-center sm:px-12">
          <h2 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-white sm:text-3xl">
            جاهز لبدء جمع بياناتك؟
          </h2>
          <p className="mt-3 text-brand-100">أنشئ حسابك المجاني الآن وابدأ في دقائق معدودة</p>
          <Link href="/register" className="mt-7 inline-block">
            <Button size="lg" variant="secondary" className="bg-white text-brand-700 hover:bg-slate-100">
              إنشاء حساب مجاني
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-400 sm:px-6">
        © {new Date().getFullYear()} منصة النماذج. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
