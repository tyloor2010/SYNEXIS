import { createFileRoute, Link } from '@tanstack/react-router';
import { PlanningPage } from '@/components/PlanningPage';
import { Button } from '@/components/ui/button';
import { canonicalLink } from '@/lib/seo-meta';

export const Route = createFileRoute('/privacy')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'الخصوصية ومعالجة البيانات — SYNEXIS' },
      {
        name: 'description',
        content:
          'كيف يعالج SYNEXIS الإحداثيات القمرية وطلبات JPL والتخزين في المتصفح ومصادر الطرف الثالث.',
      },
      { property: 'og:title', content: 'الخصوصية ومعالجة البيانات — SYNEXIS' },
      {
        property: 'og:description',
        content: 'معالجة البيانات بلغة بسيطة لملاح SYNEXIS لمواقع الهبوط على القمر.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [canonicalLink('/privacy')],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <PlanningPage title="الخصوصية ومعالجة البيانات." eyebrow="الشفافية">
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border-t border-border py-6">
          <h2 className="font-soft text-2xl font-bold">ما يغادر متصفحك</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            عند تقييم موقع ما، تُرسل الإحداثيات وخط العرض والطول وتاريخ ووقت UTC والمدة وارتفاع
            الراصد المختارة إلى خادم هذا الموقع ثم إلى NASA/JPL Horizons. لا يُرسل عنوان IP الخاص بك
            إلى JPL؛ الخادم هو من يجري الطلب.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            تُقدَّم الخطوط وجميع أصول الواجهة من هذا النطاق. لا حاجة إلى أي حساب أو بريد إلكتروني أو
            ملف مهمة، ولا تُرفع.
          </p>
        </section>
        <section className="border-t border-border py-6">
          <h2 className="font-soft text-2xl font-bold">ما يبقى على جهازك</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            تُخزَّن السيناريوهات المحفوظة والتقييم الحالي في التخزين المحلي للمتصفح تحت المفتاح{' '}
            <code>synexis-planning-v1</code>. وتُخزَّن علامة المقدمة في تخزين الجلسة. ويمكن إزالتهما
            من إعدادات بيانات الموقع في متصفحك.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            تُخزَّن بلاطات التضاريس LOLA المُتحقق منها في متصفحك بعد أول تنزيل ناجح حتى يمكن إعادة
            استخدامها دون اتصال. لا ينشئ هذا الموقع حسابات مستخدمين ولا يضع ملفات تعريف ارتباط خاصة
            بالتطبيق.
          </p>
        </section>
        <section className="border-t border-border py-6">
          <h2 className="font-soft text-2xl font-bold">البنية التحتية</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            يُقدَّم الموقع عبر Cloudflare، التي تعالج بيانات وصفية للطلبات لتغطية التقديم والأمان
            ومنع السوء. تحتفظ سجلات الخادم بفئات أخطاء محدودة فقط، وليست الإحداثيات المُدخلة. وقد
            يضع مزود الاستضافة ملفات تعريف ارتباط أمنية خاصة به؛ وهي يتحكم بها المزود وليس كود
            SYNEXIS.
          </p>
        </section>
        <section className="border-t border-border py-6">
          <h2 className="font-soft text-2xl font-bold">لا يوجد ملف تتبع</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            لا يتضمن التطبيق أي إعلانات أو تتبع عابر للمواقع أو إعادة تشغيل للجلسة. الحسابات وملخص
            سيلين يعملان محليًا من القيم الواردة من مصادرها. الذكاء الاصطناعي الخارجي اختياري
            بالكامل: لا تُرسل أي بيانات إلى NVIDIA إلا عند ضغطك صراحةً على زر السؤال، ويُرسَل فقط نص
            سؤالك واسم الموقع وتاريخه والساعات المحسوبة — بدون أي إحداثيات.
          </p>
        </section>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/explorer">افتح الملاح</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/learn">المنهجية والحدود</Link>
        </Button>
      </div>
    </PlanningPage>
  );
}
