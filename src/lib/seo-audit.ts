import { load } from 'cheerio/slim';

export type AuditCheck = {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  values: string[];
  message: string;
};
export type PageAudit = {
  url: string;
  httpStatus: number | null;
  checks: AuditCheck[];
  error?: string;
};

export function inspectPage(html: string, url: string, httpStatus = 200): PageAudit {
  const $ = load(html);
  const titles = $('title')
    .map((_, el) => $(el).text().trim())
    .get();
  const descriptions = $('meta')
    .filter((_, el) => ($(el).attr('name') ?? '').toLowerCase() === 'description')
    .map((_, el) => $(el).attr('content')?.trim() ?? '')
    .get();
  const canonicals = $('link')
    .filter((_, el) => ($(el).attr('rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'))
    .map((_, el) => $(el).attr('href') ?? '')
    .get();
  const metadata = (name: string, values: string[], min: number, max: number): AuditCheck => ({
    name,
    values,
    status:
      values.length !== 1 || !values[0]
        ? 'fail'
        : values[0].length < min || values[0].length > max
          ? 'warning'
          : 'pass',
    message:
      values.length !== 1 || !values[0]
        ? `أضف بالضبط ${name} واحدًا غير فارغ.`
        : values[0].length < min || values[0].length > max
          ? `${values[0].length} حرفًا. النطاق المقترح: ${min}–${max}؛ هذه إرشادات وليست حدًا من Google.`
          : `${values[0].length} حرفًا؛ موجود مرة واحدة.`,
  });
  let canonicalValid = false;
  try {
    const canonical = canonicals[0];
    canonicalValid =
      canonicals.length === 1 &&
      !!canonical &&
      /^https?:\/\//.test(canonical) &&
      new URL(canonical).href === new URL(url).href;
  } catch {
    /* malformed canonical */
  }
  const structured = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();
  const types: string[] = [];
  let malformed = false;
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === '@type')
        types.push(
          ...(Array.isArray(item) ? item : [item]).filter(
            (t): t is string => typeof t === 'string',
          ),
        );
      else visit(item);
    }
  };
  for (const block of structured) {
    try {
      const value: unknown = JSON.parse(block);
      if (!value || typeof value !== 'object') malformed = true;
      else visit(value);
    } catch {
      malformed = true;
    }
  }
  const checks: AuditCheck[] = [
    metadata('العنوان', titles, 30, 60),
    metadata('الوصف', descriptions, 70, 160),
    {
      name: 'الرابط القانوني',
      values: canonicals,
      status: canonicalValid ? 'pass' : 'fail',
      message: canonicalValid
        ? 'رابط قانوني واحد مطلق ذاتي-المرجع.'
        : 'أضف رابطًا قانونيًا مطلقًا واحدًا للصفحة المفضلة. الروابط القانونية البديلة تحتاج مراجعة يدوية.',
    },
    {
      name: 'البيانات البنيوية',
      values: [...new Set(types)],
      status: malformed ? 'fail' : types.length ? 'pass' : 'warning',
      message: malformed
        ? 'أصلح JSON-LD غير صالح.'
        : types.length
          ? `تم تحليل ${structured.length} كتلة JSON-LD. لا تُتحقق خصائص المخطط ولا أهلية النتائج الغنية.`
          : 'لم يُعثر على JSON-LD. فكّر في مخطط مناسب فقط عندما يدعمه المحتوى الظاهر.',
    },
    {
      name: 'العناوين',
      values: $('h1')
        .map((_, el) => $(el).text().trim())
        .get(),
      status: $('h1').length === 1 ? 'pass' : 'warning',
      message: $('h1').length === 1 ? 'عنوان رئيسي واحد.' : 'راجع تسلسل العناوين الرئيسية.',
    },
  ];
  return { url, httpStatus, checks };
}
