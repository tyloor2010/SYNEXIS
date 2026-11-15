# المعمارية

## المكدس الفعلي

- **الواجهة**: React 19 + TanStack Start/Router + TypeScript + Tailwind CSS 4 + مكونات shadcn/ui.
- **المجسم ثلاثي الأبعاد**: Three.js + `@react-three/fiber` + `@react-three/drei`.
- **البناء**: Vite 8، ومعاينة/نشر Cloudflare عبر Nitro (`cloudflare-module`).
- **الاختبارات**: Vitest.
- **لا توجد قاعدة بيانات، ولا مصادقة، ولا اعتماد على Lovable أو Supabase أو Drizzle أو بوابة AI إجبارية.**
- **الذكاء الاصطناعي اختياري وصرف عبر NVIDIA Build API** (`src/lib/selene-ai.functions.ts`)؛ بدونه تعمل «سيلين» كملخص حتمي محلي.
- **الواجهة بالعربية بالكامل (RTL)** مع خط IBM Plex Sans Arabic المستضاف محليًا في `public/fonts/`.

## المسارات

| المسار | الوظيفة |
| --- | --- |
| `/` | الصفحة الرئيسية والمقدمة البصرية |
| `/explorer` | تقييم موقع وتاريخ وأفق تضاريسي |
| `/compare` | مقارنة حتى 4 سيناريوهات |
| `/measure` | قياسات التضاريس عند الطلب |
| `/learn` | المنهجية والحدود |
| `/team` | الفريق (البيانات في src/lib/team.ts) |
| `/sites` | مواقع الهبوط المرجعية |
| `/seo` | فحص SEO عام للصفحات المنشورة |
| `/privacy` | الخصوصية |
| `/sitemap.xml` | خريطة الموقع من `staticData.sitemap` |

## تدفق البيانات

```text
المتصفح
  ├─ getLunarScenario (server function)
  │    ├─ تحقق Zod: إحداثيات/تاريخ/مدة/ارتفاع المراقب
  │    ├─ حد 30 طلبًا/دقيقة لكل IP
  │    ├─ كاش 10 دقائق + تجميع الطلبات المتطابقة
  │    ├─ NASA/JPL Horizons (الشمس 10 والأرض 399، مركز 301)
  │    └─ إرجاع sun/earth samples أو خطأ صريح بلا أرقام بديلة
  │
  ├─ useLunarTerrain
  │    ├─ terrainTileForPoint: هل النقطة داخل بلاطة south أو malapert؟
  │    ├─ تحميل 8 MB مرة واحدة عند الحاجة فقط
  │    ├─ تحقق SHA-256 + Cache API اختياري
  │    └─ terrain-horizon.worker: أفق 360° حتى 15 km
  │
  ├─ askSeleneNvidia (دالة خادم، اختيارية)
  │    ├─ تقرأ NVIDIA_API_KEY / NVIDIA_MODEL من ربط العامل (__env__) أو process.env
  │    ├─ حد 4 طلبات/دقيقة + 10/يوم لكل IP + 200/يوم للنظام، كاش 24 ساعات
  │    ├─ تُرسل إلى NVIDIA فقط نص السؤال + الموقع + التاريخ + الساعات (بلا إحداثيات)
  │    └─ تستدعي أدوات الحساب نفسها ثم تصيغ الرد بالعربية (≤350 رمزًا)
  └─ حسابات محلية
       ├─ sunlight / Earth visibility مع الأفق
       ├─ powerBudget وsizeMission
       ├─ المسافات والمقاطع والفوّهات
       └─ Selene brief حتمي من نتائج المصدر
```

## بلاطات LOLA

| البلاطة | الملف | التغطية التقريبية |
| --- | --- | --- |
| south | `public/assets/lola-south-40m.bin` | القطب حتى نحو −88.65° |
| malapert | `public/assets/lola-malapert-40m.bin` | نحو −87.7° إلى −85° |

لا تُختار البلاطة حسب خط العرض وحده؛ `terrainTileForPoint` يختبر تغطية الإحداثيات الفعلية. النقاط خارج البلاطتين (مثل Apollo 11 أو الفجوة بينهما) لا تحمّل أي ملف وتستخدم أفقًا كرويًا مع رسالة واضحة.

## الخادم

- `src/server.ts`: ترويسات أمان (CSP، `X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy) وصفحة خطأ موحّدة.
- `src/start.ts`: middleware للأخطاء وCSRF على دوال الخادم.
- `src/lib/lunar.functions.ts`: وكيل JPL الوحيد. يستخدم `redirect: "manual"` لأن Cloudflare Workers يرفض `"error"`، ويرفض أي إعادة توجيه غير متوقعة.
- `src/lib/seo-audit.functions.ts`: فحص sitemap والصفحات المنشورة، كاش 5 دقائق وحد 12 طلبًا/دقيقة لكل IP.
- `src/lib/request-guard.server.ts`: حد معدل بسيط داخل الـ isolate؛ للحماية الصلبة يُضاف WAF/حد على مستوى المنصة.

## الأمان

- لا أسرار مطلوبة للتشغيل. الملفات الحساسة (`.env`, `.dev.vars`) في `.gitignore`؛ يوجد `.env.example` مرجعي بلا قيم. في الإنتاج يُضبط `NVIDIA_API_KEY` عبر `wrangler secret put`.
- مدخلات JPL محدودة ومتحقق منها، والمصدر ثابت HTTPS.
- لا تُسجَّل إحداثيات المستخدم في سجلات الأخطاء.
- CSP يمنع الموارد الخارجية؛ الخطوط والصور والتضاريس من نفس النطاق.
- `_headers` يضبط ترويسات الأصول الثابتة وكاش الأصول ذات البصمة.
- صفحة `/privacy` توضح ما يُرسل إلى JPL وما يبقى في المتصفح.

## أنماط الفشل

- **JPL غير متاح**: نتيجة `error` برسالة صريحة، بلا أرقام بديلة.
- **بلاطة LOLA غير متاحة أو فشل التحقق**: لا تُعرض تضاريس بديلة؛ يُستخدم أفق كروي مع تنبيه.
- **3D غير مدعوم**: تبقى القياسات والقوائم تعمل، مع رسالة في لوحة الخريطة.
- **فشل حفظ المتصفح**: السيناريوهات تعمل في الجلسة الحالية دون كسر الصفحة.
