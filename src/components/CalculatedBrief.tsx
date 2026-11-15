import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { SendHorizonal, Bot, ShieldCheck, Sparkles } from 'lucide-react';
import { askSeleneNvidia, type SeleneNvidiaAnswer } from '@/lib/selene-ai.functions';
import type { LunarResult } from '@/lib/lunar-data';
import { executeSeleneTool, type SeleneContext } from '@/lib/selene-tools';
import type { visibilityIntervals } from '@/lib/lunar-windows';
import { terrainElevation, type TerrainGrid, type TerrainHorizon } from '@/lib/lunar-terrain';

type SeleneToolCall = { id: string; name: string; arguments: string };

type SeleneInput = {
  question: string;
  result: LunarResult;
  horizon: TerrainHorizon | null;
  purpose?: 'auto' | 'manual';
  toolCalls?: SeleneToolCall[];
  assistantContent?: string;
  toolResults?: { id: string; content: string }[];
};

// Coordinates are never echoed back to NVIDIA: tool outputs are redacted
// before the conversation continues.
const COORDINATE_KEYS = new Set(['latitude', 'longitude', 'lat', 'lng', 'lon']);

const AUTO_QUESTION =
  'اكتب قراءة قصيرة جدًا (جملتان فقط) بالعربية لنتائج هذه النافذة: ساعات الإضاءة والظلام وحالة رؤية الأرض. بدون أرقام جديدة، وابدأ مباشرة بالنتيجة بدون مقدمة.';

function redactCoordinates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactCoordinates);
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (COORDINATE_KEYS.has(key.trim().toLowerCase())) continue;
      output[key] = redactCoordinates(entry);
    }
    return output;
  }
  return value;
}

export function CalculatedBrief({
  result,
  horizon,
  grid = null,
  calculating = false,
}: {
  result: LunarResult;
  horizon: TerrainHorizon | null;
  grid?: TerrainGrid | null;
  calculating?: boolean;
}) {
  const context: SeleneContext = { result, horizon, grid, specifications: null };
  // A null horizon is only provisional while the covered tile is still being
  // computed. Outside tile coverage the spherical horizon is the final state
  // the deterministic brief already reports, so the AI may run with it.
  const covered = useMemo(
    () =>
      grid
        ? terrainElevation(grid, {
            latitude: result.scenario.latitude,
            longitude: result.scenario.longitude,
          }) !== null
        : false,
    [grid, result.scenario.latitude, result.scenario.longitude],
  );
  const sun = executeSeleneTool('illumination_windows', {}, context).value as ReturnType<
    typeof visibilityIntervals
  >;
  const earth = executeSeleneTool('earth_windows', {}, context).value as ReturnType<
    typeof visibilityIntervals
  >;
  const askNvidia = useServerFn(askSeleneNvidia);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ text: string; model: string; toolsUsed: number } | null>(
    null,
  );
  const [analysis, setAnalysis] = useState<{
    key: string;
    text: string;
    model: string;
  } | null>(null);
  const [analysisLoadingKey, setAnalysisLoadingKey] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<{ key: string; message: string } | null>(null);
  const autoRun = useRef(0);

  const runToolLoop = async (
    initial: SeleneInput,
    onToolDone: (toolsUsed: number) => void,
  ): Promise<SeleneNvidiaAnswer | null> => {
    let input = initial;
    for (let round = 0; round < 3; round += 1) {
      const response = await askNvidia({ data: input });
      if (response.status === 'tool_calls') {
        onToolDone(response.toolCalls.length);
        const toolResults = response.toolCalls.map((toolCall) => {
          let args: unknown = {};
          try {
            args = JSON.parse(toolCall.arguments);
          } catch {
            args = {};
          }
          let toolOutput: unknown;
          try {
            toolOutput = executeSeleneTool(toolCall.name, args, context);
          } catch {
            toolOutput = { error: 'Tool not allowed or failed.' };
          }
          return {
            id: toolCall.id,
            content: JSON.stringify(redactCoordinates(toolOutput)).slice(0, 7800),
          };
        });
        input = {
          ...input,
          toolCalls: response.toolCalls,
          assistantContent: response.assistantContent,
          toolResults,
        };
        continue;
      }
      return response;
    }
    return null;
  };

  // AI analysis is part of the analysis itself, generated automatically
  // after every connected evaluation — not behind a separate button.
  const resultKey =
    result.status === 'connected'
      ? [
          result.scenario.name,
          result.scenario.latitude,
          result.scenario.longitude,
          result.scenario.date,
          result.retrievedAt ?? '',
        ].join('|')
      : null;
  // A new point or a newly computed horizon (spherical -> local) is a new
  // analysis: an answer from the provisional horizon must never outlive it.
  const horizonKey = horizon
    ? `${horizon.elevationM.toFixed(2)}:${horizon.observerHeightM}:${horizon.radiusM.toFixed(0)}`
    : 'spherical';
  const analysisKey = resultKey ? `${resultKey}|${horizonKey}` : null;
  const analysisVisible = analysis && analysis.key === analysisKey ? analysis : null;
  const analysisLoading = analysisKey !== null && analysisLoadingKey === analysisKey;
  const analysisErrorVisible =
    analysisError && analysisError.key === analysisKey ? analysisError.message : null;
  const attemptedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!analysisKey) return;
    if (calculating || (covered && horizon === null)) return; // wait for the local horizon
    if (attemptedKey.current === analysisKey) return;
    attemptedKey.current = analysisKey;
    const runId = ++autoRun.current;
    setAnalysisLoadingKey(analysisKey);
    setAnalysisError(null);
    void (async () => {
      try {
        const final = await runToolLoop(
          {
            question: AUTO_QUESTION,
            result,
            horizon,
            purpose: 'auto',
          },
          () => {},
        );
        // Ignore stale answers: only the latest run may publish, and the
        // rendered block is filtered by the current key anyway.
        if (autoRun.current === runId && final?.status === 'connected') {
          setAnalysis({ key: analysisKey, text: final.answer, model: final.model });
          setAnalysisError(null);
        } else if (autoRun.current === runId && final?.status === 'error') {
          // Rate limits or upstream errors are surfaced quietly; the
          // deterministic brief remains the reference.
          setAnalysisError({ key: analysisKey, message: final.message });
        }
      } catch {
        // Silent: the deterministic brief remains the source of truth.
      } finally {
        if (autoRun.current === runId) setAnalysisLoadingKey(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisKey, calculating, horizon, grid, result]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    // Refuse to answer while the terrain horizon is still being computed —
    // the spherical fallback would be silently mistaken for the local one.
    if (calculating || (covered && !horizon)) {
      setAnswer(null);
      setNotice('أفق التضاريس ما زال قيد الحساب — انتظر اكتماله ثم اسأل مرة أخرى.');
      return;
    }
    setLoading(true);
    setNotice(null);
    setAnswer(null);
    try {
      let toolCallsMade = 0;
      const final = await runToolLoop(
        { question: trimmed, result, horizon, purpose: 'manual' },
        (added) => {
          toolCallsMade += added;
        },
      );
      if (final?.status === 'connected') {
        setAnswer({ text: final.answer, model: final.model, toolsUsed: toolCallsMade });
        setQuestion('');
      } else if (final?.status === 'unavailable') {
        setNotice('الذكاء الخارجي (NVIDIA) غير مفعّل — يعمل الملخص المحلي أعلاه بدلًا منه.');
      } else if (final?.status === 'error') {
        setNotice(final.message);
      } else {
        setNotice('تعذر الوصول إلى NVIDIA — اكتفِ بالملخص المحلي.');
      }
    } catch {
      setNotice('تعذر الوصول إلى NVIDIA — جرّب لاحقًا أو اكتفِ بالملخص المحلي.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <details className="mt-5 border-t border-border py-4">
      <summary className="cursor-pointer font-soft text-lg font-bold">
        سيلين · الملخص المحسوب
      </summary>
      <p className="mt-3 text-xs leading-relaxed">
        لموقع {result.scenario.name}، تحتوي نافذة التقييم البالغة {sun.durationHours} ساعة على{' '}
        {sun.visibleHours.toFixed(1)} ساعة إضاءة و{earth.visibleHours.toFixed(1)} ساعة رؤية الأرض.
        أطول فترة ظلام متصل {sun.longestHiddenHours.toFixed(1)} ساعة؛ وأطول انقطاع في رؤية الأرض{' '}
        {earth.longestHiddenHours.toFixed(1)} ساعة. المصدر: NASA/JPL Horizons
        {horizon
          ? ' مع عينة تضاريس NASA/LRO/LOLA'
          : ' مع أفق كروي فقط؛ لا تتوفر تغطية تضاريس لهذه النقطة'}
        . هذه نتائج فحص أولي محسوبة، وليست شهادة سلامة هبوط أو ضمان اتصال. جدوى الطاقة تحتاج إدخال
        مواصفات معداتك.
      </p>
      {analysisVisible && (
        <div className="mt-3 border border-primary/30 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            سيلين تقرأ النتيجة · عبر NVIDIA
          </p>
          <p className="mt-2 text-xs leading-relaxed">{analysisVisible.text}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            مولّدة آليًا بعد التقييم مباشرة · الأرقام من مخرجات الأدوات نفسها · ليست شهادة مهمة.
          </p>
        </div>
      )}
      {!analysisVisible && analysisLoading && (
        <p className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"
            aria-hidden="true"
          />
          سيلين تقرأ النتيجة…
        </p>
      )}
      {!analysisVisible && !analysisLoading && analysisErrorVisible && (
        <p role="status" className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          تعذر توليد التحليل التلقائي: {analysisErrorVisible} — الملخص المحلي أعلاه هو المرجع.
        </p>
      )}
      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        شرح محلي حتمي من النتائج الحالية · لا تُولّد الأرقام خارج مصدرها.
      </p>

      <form onSubmit={(event) => void submit(event)} className="mt-4 border-t border-border pt-4">
        <label htmlFor="selene-question" className="lunar-label">
          الذكاء الاصطناعي عبر NVIDIA · اسأل سيلين
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="selene-question"
            type="text"
            className="lunar-input min-w-0 flex-1"
            placeholder="مثال: ما أطول فترة ظلام متواصلة هنا؟"
            value={question}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            aria-label="سؤالك لسيلين"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Bot className="h-4 w-4" aria-hidden="true" />
            {loading ? 'جارٍ السؤال…' : 'اسأل'}
            <SendHorizonal className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        {notice && (
          <p role="alert" className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            {notice}
          </p>
        )}
        {answer && (
          <div className="mt-3 rounded-md border border-border bg-background p-3">
            <p className="text-xs leading-relaxed">{answer.text}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {answer.toolsUsed > 0
                ? `رد عبر ${answer.model} · الأرقام قادمة من أدوات الحساب فقط (${answer.toolsUsed} استدعاء) · ليست شهادة مهمة.`
                : `رد عبر ${answer.model} · إجابة عامة — لم تُستدعَ أدوات المهمة، لا تُعتمد كبيانات مهمة.`}
            </p>
          </div>
        )}
      </form>
    </details>
  );
}
