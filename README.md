# منصة النماذج | Form Builder SaaS

منصة حديثة لإنشاء ونشر النماذج وجمع البيانات الميدانية، مع دعم كامل للموقع الجغرافي (GPS)
والمنطق الشرطي والتحليلات. مبنية بـ Next.js وSupabase، وقابلة للنشر مجاناً على Vercel + Supabase Free Tier.

راجع [`ARCHITECTURE.md`](./ARCHITECTURE.md) للتفاصيل الكاملة حول قرارات التصميم والمعمارية.

## المزايا

- منشئ نماذج بالسحب والإفلات (dnd-kit) مع أنواع حقول متعددة (نص، رقم، بريد، تاريخ، اختيارات، موقع جغرافي، ملف)
- منطق شرطي (إظهار/إخفاء حقول حسب إجابات سابقة) عبر محرك مستقل قابل لإعادة الاستخدام
- تحديد الموقع الجغرافي (GPS) من المتصفح مع خرائط OpenStreetMap/Leaflet
- نشر النماذج عبر رابط عام + رمز QR
- لوحة تحكم بالعربية بالكامل (RTL) مع تحليلات ورسوم بيانية
- تصدير الردود إلى Excel (`.xlsx`) بعناوين عربية ديناميكية
- أمان صارم عبر Row Level Security على مستوى Supabase/PostgreSQL

## المتطلبات

- Node.js 20+
- حساب [Supabase](https://supabase.com) (مجاني)
- حساب [Vercel](https://vercel.com) (مجاني، للنشر)

## التشغيل محلياً

### 1. تثبيت الحزم

```bash
npm install
```

### 2. إعداد Supabase

1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com).
2. من `SQL Editor`، نفّذ ملفات الهجرة بالترتيب من مجلد `supabase/migrations/`:
   - `0001_initial_schema.sql`
   - `0002_rls_policies.sql`
   - `0003_storage_and_helpers.sql`
3. من `Project Settings > API`، انسخ:
   - `Project URL`
   - `anon public` key
   - `service_role` key (سرّي، لا تشاركه أبداً)
4. من `Authentication > Providers`، تأكد من تفعيل `Email`.

### 3. متغيرات البيئة

```bash
cp .env.local.example .env.local
```

عدّل `.env.local` وأدخل قيم Supabase الخاصة بك.

### 4. تشغيل خادم التطوير

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## النشر على Vercel (مجاني)

1. ادفع المشروع إلى GitHub (راجع القسم أدناه).
2. من [vercel.com](https://vercel.com)، أنشئ مشروعاً جديداً واربطه بمستودع GitHub.
3. أضف متغيرات البيئة نفسها الموجودة في `.env.local` إلى إعدادات Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (رابط نطاق Vercel النهائي، مثال: `https://walid-forms.vercel.app`)
4. اضغط Deploy.

## البنية

```
src/
├── app/            # صفحات Next.js App Router
├── components/     # مكونات واجهة المستخدم
├── lib/            # منطق الأعمال (Supabase، التحقق، المنطق الشرطي، التصدير)
├── types/          # أنواع TypeScript
├── hooks/          # React hooks مخصصة
└── proxy.ts        # حماية المسارات (Next.js middleware)

supabase/
└── migrations/     # ملفات SQL لإنشاء المخطط وسياسات RLS
```

## الأوامر المتاحة

```bash
npm run dev      # خادم التطوير
npm run build    # بناء الإنتاج
npm run start    # تشغيل نسخة الإنتاج محلياً
npm run lint     # فحص الكود
```

## الحالة الحالية للمزايا

جميع المزايا الموصوفة في دفتر الشروط منفذة ومتصلة فعلياً بـ Supabase (بدون بيانات وهمية):
CRUD النماذج، Form Builder بالسحب والإفلات، المنطق الشرطي، تحديد الموقع GPS، الصفحة العامة
للنموذج، الردود مع خريطة وفلاتر، التحليلات، تصدير Excel، المشاركة عبر رابط/QR، ولوحة تحكم كاملة بالعربية.

رفع الملفات (`رفع ملف`) متصل بـ Supabase Storage (bucket خاص، غير عام) مع روابط موقّعة عند الحاجة.

الوضع الليلي (dark mode) غير منفّذ في هذه النسخة الأولى، تماشياً مع توصية دفتر الشروط بعدم
تعقيد المشروع دون داعٍ — يمكن إضافته لاحقاً دون تغيير جذري في البنية.
