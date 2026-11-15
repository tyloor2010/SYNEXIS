import { useCallback, useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowUpRight, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EclipseIntro } from '@/components/EclipseIntro';
import { CustomCursor } from '@/components/CustomCursor';
import { SynexisHeader } from '@/components/SynexisHeader';
import { HomeMoon } from '@/components/HomeMoon';
import astronaut from '@/assets/synexis-astronaut.webp';
import satellite from '@/assets/synexis-satellite.webp';
import { claimOpening } from '@/lib/intro-visit';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-3 text-[10px] font-bold uppercase">
      <span className="h-px w-8 shrink-0 bg-current" />
      {children}
    </p>
  );
}

export function SynexisHome() {
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    setShowIntro(claimOpening(window.sessionStorage));
  }, []);
  const finishIntro = useCallback(() => setShowIntro(false), []);

  return (
    <>
      {showIntro && <EclipseIntro onComplete={finishIntro} />}
      <main
        inert={showIntro}
        className="stage-bg min-h-screen overflow-hidden font-mono-ui text-foreground synexis-app"
      >
        <CustomCursor />
        <SynexisHeader />
        <section
          id="overview"
          className="scientific-hero synexis-hero relative flex items-center justify-center overflow-hidden px-5 py-16 md:px-14"
        >
          <div className="hero-blob hero-blob-left" aria-hidden="true" />
          <div className="hero-blob hero-blob-right" aria-hidden="true" />
          <div className="hero-blob hero-blob-bottom" aria-hidden="true" />
          <img
            src={astronaut}
            width="720"
            height="900"
            loading="eager"
            fetchPriority="high"
            alt=""
            className="hero-astronaut float-strong"
          />
          <img src={satellite} width="640" height="640" alt="" className="hero-satellite drift" />
          <div className="hero-editorial relative mx-auto text-center">
            <p className="mb-7 text-[10px] font-bold uppercase">
              تحدّي NASA Space Apps Challenge 2026 · مشروع مستقل
            </p>
            <h1 className="hero-editorial-title synexis-title font-display"><span>SYNEXIS</span></h1>
            <h2 className="mx-auto mt-9 max-w-lg font-soft text-3xl font-bold sm:text-4xl">
              ملاح مواقع<br />الهبوط على القمر
            </h2>
            <p className="mx-auto mt-4 max-w-md font-soft text-sm leading-relaxed text-muted-foreground">
              تضاريس القطب الجنوبي. الإضاءة. ظهور الأرض.<br />مكان واحد لمقارنة أين ومتى تهبط.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link to="/explorer"><Moon /> استكشف مواقع الهبوط</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/learn">البيانات والمنهجية <ArrowUpRight /></Link></Button>
            </div>
            <div className="mx-auto mt-7 flex max-w-xl flex-wrap justify-center gap-5 border-t border-foreground/15 pt-4 text-[9px] uppercase text-muted-foreground">
              <span>NASA/JPL Horizons</span><span>إحداثيات قمرية</span><span>نتائج قابلة لتتبع المصدر</span>
            </div>
          </div>
          <ArrowDown className="absolute bottom-6 left-1/2 h-5 w-5" />
        </section>

        <section className="border-t border-border px-5 py-8 md:px-14">
          <div className="mx-auto max-w-6xl">
            <Label>02 / القمر · بيانات مباشرة وتجربة اختبار</Label>
            <HomeMoon />
          </div>
        </section>

        <section id="method" className="px-5 py-16 md:px-14">
          <div className="mx-auto max-w-6xl">
            <Label>03 / المنهجية والمصادر</Label>
            <div className="mt-5 grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="font-soft text-3xl font-bold sm:text-5xl">مواقع حقيقية.<br />حدود واضحة.</h2>
                <p className="mt-5 font-soft text-sm leading-relaxed text-muted-foreground">
                  يطلب SYNEXIS السمت والارتفاع الظاهري للشمس والأرض من JPL Horizons كما يُرصدا من إحداثيات القمر المختارة. عينات كل ساعة تكشف التغير عبر نافذة مهمة يختارها المستخدم تصل إلى سبعة أيام.
                </p>
                <p className="mt-4 font-soft text-sm leading-relaxed text-muted-foreground">
                  ارتفاع الشمس الموجب يعني توفر إضاءة هندسية، لا قدرة كهربائية فعلية. ارتفاع الأرض الموجب يعني ظهورًا هندسيًا للأرض، لا ضمان اتصال فعلي. تُقيّم التضاريس المحلية فقط داخل تغطية LOLA المتاحة. لا تُنمذج قيود الهوائيات ولا حجب الكسوف.
                </p>
                <p className="mt-4 font-soft text-sm leading-relaxed text-muted-foreground">
                  أوقات الغروب أقواس عبور كل ساعة وليست تنبؤات دقيقة بالأحداث. ملفات أفق LOLA المحلية تعمل على شبكة مصدر 40 مترًا ونصف قطر 15 كم وحدود عينة صريحة.
                </p>
              </div>
              <div className="border-t border-border py-5">
                <h3 className="font-soft text-xl font-bold">النسب العلمي للمصادر</h3>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  مواضع الشمس والأرض: NASA/JPL Horizons عبر استدعاء مباشر من الخادم.<br />
                  بيانات التضاريس: ملفات NASA/LRO/LOLA محلية ومتحقق من سلامتها، وليست بثًا آنيًا.<br />
                  نسيج سطح القمر: NASA SVS / LROC WAC.
                </p>
                <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
                  وضع البيانات العشوائية منفصل للاختبار فقط ولا يمثل بيانات ناسا أو نتائج علمية.
                </p>
                <Button asChild variant="outline" className="mt-4"><a href="/sources">تفاصيل المصادر والمستودع <ArrowUpRight /></a></Button>
              </div>
            </div>
            <div className="mt-8 border-t border-foreground/15 pt-5 text-[10px] leading-relaxed text-muted-foreground">
              إحداثيات الهبوط: مراجع NASA NSSDCA / LRO. مركز القمر: 301 · الأهداف: الشمس 10، الأرض 399 · خط الطول موجب شرقًا. الرسوم التوضيحية ليست كلها صورًا مباشرة من ناسا. أداة مقارنة تعليمية وليست تخطيطًا معتمدًا لرحلة الفضاء.
            </div>
          </div>
        </section>

        <footer className="border-t border-foreground/15 px-5 py-14 md:px-14">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-5">
            <div><strong className="font-display text-4xl">SYNEXIS</strong><p className="mt-3 text-xs text-muted-foreground">ملاح مواقع الهبوط على القمر</p></div>
            <div className="max-w-sm text-[10px] leading-relaxed text-muted-foreground">
              <p>بُني لتحدي NASA Space Apps Challenge 2026. مشروع مستقل، ولا توجد علاقة رسمية بالناسا.</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                <Link to="/privacy" className="underline underline-offset-4">الخصوصية ومعالجة البيانات</Link>
                <a href="/sources" className="underline underline-offset-4">المصادر والمستودع</a>
                <Link to="/team" className="underline underline-offset-4">عن الفريق</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
