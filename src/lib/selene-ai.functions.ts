import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { LunarResult } from './lunar-data';
import type { TerrainHorizon } from './lunar-terrain';

/**
 * Selene's external brain: the NVIDIA Build API (OpenAI-compatible), never
 * exposed to the browser. The API key is read from the worker binding or
 * process.env server-side; the client never sees it.
 *
 * Two turns per question:
 * 1. Initial turn: the model receives only the question, the site name/date
 *    and the already-computed hourly summary — never coordinates. It may
 *    answer directly or request up to four tools.
 * 2. Tool turn: the client executes the tools locally against the full LOLA
 *    grid (the grid is never uploaded), redacts every coordinate from the
 *    outputs, and returns them for the model's final Arabic answer.
 *
 * Limits (AI_LIMITS.md): 4 tool calls per request, ~350 token reply,
 * 24 h answer cache, 10 requests/day per IP, 200/day system-wide,
 * 4 requests/minute. Without a key Selene stays the deterministic local brief.
 */

const NVIDIA_CHAT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3.5-bolt-e4b';
const TIMEOUT_MS = 20_000;
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_ANSWER_CHARS = 1500;
const CACHE_TTL_MS = 24 * 60 * 60_000;
const CACHE_LIMIT = 100;

const horizonSample = z.object({
  time: z.string().min(1).max(60),
  azimuth: z.number().min(0).max(360),
  elevation: z.number().min(-90).max(90),
  rangeKm: z.number().positive().optional(),
});

const scenarioSchema = z.object({
  name: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startHour: z.number().int().min(0).max(23).optional(),
  durationHours: z.number().int().min(1).max(168).optional(),
  observerElevationKm: z.number().min(-20).max(20).optional(),
  observerHeightM: z.number().min(0).max(100).optional(),
});

const resultSchema = z.object({
  status: z.literal('connected'),
  scenario: scenarioSchema,
  sun: z.array(horizonSample).min(2).max(200),
  earth: z.array(horizonSample).min(2).max(200),
  retrievedAt: z.string().nullable(),
  message: z.string().max(200),
});

const horizonSchema = z.object({
  angles: z.array(z.number().min(-90).max(90)).length(360),
  radiusM: z.number().positive(),
  observerHeightM: z.number().min(0).max(100),
  elevationM: z.number().min(-20000).max(20000),
  tileSha256: z.string().max(128).optional(),
});

const toolCallSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(64),
  arguments: z.string().max(4096),
});

const toolResultSchema = z.object({
  id: z.string().min(1).max(128),
  content: z.string().max(8192),
});

const inputSchema = z
  .object({
    question: z.string().trim().min(1).max(500),
    result: resultSchema,
    horizon: horizonSchema.nullable(),
    purpose: z.enum(['auto', 'manual']).optional().default('manual'),
    toolCalls: z.array(toolCallSchema).max(4).optional(),
    assistantContent: z.string().max(2000).optional(),
    toolResults: z.array(toolResultSchema).max(4).optional(),
  })
  .superRefine((value, ctx) => {
    const hasCalls = value.toolCalls !== undefined;
    const hasResults = value.toolResults !== undefined;
    if (hasCalls !== hasResults) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'toolCalls and toolResults must be provided together',
      });
    }
  });

export type SeleneToolCall = z.infer<typeof toolCallSchema>;
export type SeleneNvidiaAnswer =
  | { status: 'tool_calls'; toolCalls: SeleneToolCall[]; assistantContent: string }
  | { status: 'connected'; model: string; answer: string; retrievedAt: string }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

type CacheEntry = { expiresAt: number; answer: SeleneNvidiaAnswer };
const cache = new Map<string, CacheEntry>();

function pruneCache(now: number) {
  for (const [key, entry] of cache) if (entry.expiresAt <= now) cache.delete(key);
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function readBinding(name: string): string {
  const workerEnv = (globalThis as { __env__?: Record<string, string | undefined> }).__env__;
  const fromWorker = workerEnv?.[name];
  if (typeof fromWorker === 'string' && fromWorker.length > 0) return fromWorker;
  return typeof process !== 'undefined' ? (process.env?.[name] ?? '') : '';
}

const pointSchema = {
  type: 'object',
  properties: {
    latitude: { type: 'number', minimum: -90, maximum: 90 },
    longitude: { type: 'number', minimum: -180, maximum: 180 },
  },
  required: ['latitude', 'longitude'],
  additionalProperties: false,
};

const emptyParams = { type: 'object', properties: {}, additionalProperties: false };

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'illumination_windows',
      description:
        'Sun above the sampled horizon: total sunlight hours, longest darkness and intervals. Returns computed hours.',
      parameters: emptyParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'earth_windows',
      description:
        'Earth above the sampled horizon: Earth-visible hours and longest interruption. Returns computed hours.',
      parameters: emptyParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'mission_sizing',
      description:
        'Battery charge and solar-array sizing only if the user supplied power specifications; otherwise empty values.',
      parameters: emptyParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'geodesic_distance',
      description:
        'Great-circle distance between two points on the lunar reference sphere. Input: {a: {latitude, longitude}, b: {latitude, longitude}}.',
      parameters: {
        type: 'object',
        properties: { a: pointSchema, b: pointSchema },
        required: ['a', 'b'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'elevation_at',
      description:
        'Bilinear 40 m LOLA elevation at one point, or null outside tile coverage. Input: {latitude, longitude}.',
      parameters: pointSchema,
    },
  },
  {
    type: 'function',
    function: {
      name: 'line_of_sight',
      description:
        'Clear line-of-sight between two points along the terrain profile with spherical curvature. Input: {a: {latitude, longitude}, b: {latitude, longitude}, observerHeightM: number}.',
      parameters: {
        type: 'object',
        properties: {
          a: pointSchema,
          b: pointSchema,
          observerHeightM: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['a', 'b', 'observerHeightM'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'terrain_profile',
      description:
        'Sampled great-circle terrain profile of 2–50 points with elevations and slopes. Input: {points: [{latitude, longitude}, ...]}.',
      parameters: {
        type: 'object',
        properties: {
          points: { type: 'array', items: pointSchema, minItems: 2, maxItems: 50 },
        },
        required: ['points'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crater_measure',
      description:
        'Circumcircle of a crater rim from exactly three user-selected points. Input: {points: [point, point, point]}.',
      parameters: {
        type: 'object',
        properties: {
          points: { type: 'array', items: pointSchema, minItems: 3, maxItems: 3 },
        },
        required: ['points'],
        additionalProperties: false,
      },
    },
  },
];

const SYSTEM_PROMPT = [
  'أنت «سيلين»، مساعد SYNEXIS للقراءة فقط.',
  'القواعد:',
  '1) أي رقم تذكره يجب أن يأتي حصرًا من مخرجات الأدوات التي تستدعيها أو من بيانات المستخدم الحالية.',
  '2) ممنوع اختراع قيم أو استكمال معلومات من خارج المصدر؛ إن لم تكفِ البيانات قل ذلك صراحة.',
  '3) لا ترسل ولا تعدّل ولا تنفّذ أي إجراء؛ الأدوات قراءة فقط.',
  '4) لن تُقبل إجابتك إن لم تستدعِ أداة الحساب المناسبة حتى ولو كانت الإجابة واضحة من الذاكرة.',
  '6) أجب بالعربية، ولا تتجاوز 350 رمزًا تقريبًا.',
  '7) لا تذكر إحداثيات دقيقة في إجابتك؛ استخدم اسم الموقع والوصف.',
  '8) هذه نتائج فحص أولي، وليست شهادة سلامة هبوط أو ضمان اتصال.',
].join(' ');

type CompletionMessage = {
  content?: string | null;
  tool_calls?: unknown[];
};

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function callNvidia(
  key: string,
  model: string,
  messages: unknown[],
  toolChoice: 'required' | 'none',
): Promise<{ content: string; toolCalls: SeleneToolCall[] }> {
  const response = await fetch(NVIDIA_CHAT_URL, {
    method: 'POST',
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 350,
      stream: false,
      tools: TOOLS,
      tool_choice: toolChoice,
    }),
  });
  if (!response.ok) {
    // Only the status class is surfaced; never the key, body or upstream text.
    const kind =
      response.status === 401 || response.status === 403
        ? 'مفتاح NVIDIA غير صالح أو غير مُصرّح له.'
        : response.status === 429
          ? 'تجاوزت الحد المسموح لطلبات NVIDIA، أعد المحاولة لاحقًا.'
          : response.status >= 500
            ? 'خدمة NVIDIA غير متاحة مؤقتًا.'
            : 'تعذر الاتصال بـ NVIDIA.';
    throw new Error(kind);
  }
  const { readBoundedText } = await import('./bounded-response.server');
  const text = await readBoundedText(response, MAX_RESPONSE_BYTES);
  const parsed = z
    .object({
      choices: z.array(z.object({ message: z.record(z.string(), z.unknown()) })).min(1),
    })
    .safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error('تعذر تحليل رد NVIDIA.');
  const message = (parsed.data.choices[0]?.message ?? {}) as CompletionMessage;
  const rawCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const toolCalls: SeleneToolCall[] = rawCalls.slice(0, 4).map((raw, index) => {
    const call = raw as { id?: string; function?: { name?: string; arguments?: string } };
    return {
      id: typeof call.id === 'string' && call.id ? call.id : `call_${index}`,
      name: typeof call.function?.name === 'string' ? call.function.name.slice(0, 64) : '',
      arguments:
        typeof call.function?.arguments === 'string'
          ? call.function.arguments.slice(0, 4096)
          : '{}',
    };
  });
  return { content: message.content?.trim() ?? '', toolCalls };
}

export const askSeleneNvidia = createServerFn({ method: 'POST' })
  .validator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<SeleneNvidiaAnswer> => {
    const { allowRequest, consumeRateLimit } = await import('./request-guard.server');

    const dayBucket = data.purpose === 'auto' ? 'selene-ai:auto' : 'selene-ai:day';
    const dayLimit = data.purpose === 'auto' ? 20 : 10;
    if (
      !consumeRateLimit('selene-ai:system', 200, 86_400_000) ||
      !allowRequest(dayBucket, dayLimit, 86_400_000) ||
      !allowRequest('selene-ai:min', 4, 60_000)
    )
      return { status: 'error', message: 'وصلت إلى الحد المسموح من طلبات سيلين الذكية.' };

    const isContinuation = Boolean(data.toolCalls && data.toolResults);
    const now = Date.now();
    pruneCache(now);
    const initialKey = await sha256Hex(
      JSON.stringify({ question: data.question, result: data.result, horizon: data.horizon }),
    );

    if (!isContinuation) {
      const cached = cache.get(initialKey);
      if (cached && cached.expiresAt > now) return cached.answer;
    }

    const key = readBinding('NVIDIA_API_KEY');
    if (!key)
      return {
        status: 'unavailable',
        message: 'الذكاء الاصطناعي الخارجي غير مفعّل: أضف NVIDIA_API_KEY في ملف .env محليًا.',
      };
    const model = readBinding('NVIDIA_MODEL') || DEFAULT_MODEL;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          `الموقع: ${data.result.scenario.name}.`,
          `التاريخ: ${data.result.scenario.date}. المدة التقييمية: ${data.result.scenario.durationHours ?? data.result.sun.length - 1} ساعة.`,
          'هذه بيانات JPL/Horizons/LOLA محسوبة بالفعل؛ استدعِ الأدوات المناسبة قبل أي رقم.',
          `سؤال المستخدم: ${data.question}`,
        ].join(' '),
      },
    ];

    if (isContinuation) {
      messages.push({
        role: 'assistant',
        content: data.assistantContent ?? '',
        tool_calls: (data.toolCalls ?? []).map((call) => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: call.arguments },
        })),
      } as never);
      for (const result of data.toolResults ?? []) {
        messages.push({ role: 'tool', tool_call_id: result.id, content: result.content } as never);
      }
    }

    try {
      const completion = await callNvidia(
        key,
        model,
        messages,
        isContinuation ? 'none' : 'required',
      );

      if (!isContinuation && completion.toolCalls.length > 0) {
        return {
          status: 'tool_calls',
          toolCalls: completion.toolCalls,
          assistantContent: completion.content.slice(0, 2000),
        };
      }

      if (!completion.content)
        return {
          status: 'error',
          message: 'لم تُرجع NVIDIA إجابة مفيدة؛ يُعرض الملخص المحلي بدلًا منها.',
        };

      const answer: SeleneNvidiaAnswer = {
        status: 'connected',
        model,
        answer: completion.content.slice(0, MAX_ANSWER_CHARS),
        retrievedAt: new Date().toISOString(),
      };
      cache.set(initialKey, { expiresAt: now + CACHE_TTL_MS, answer });
      return answer;
    } catch (error) {
      console.error('selene-ai upstream error');
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'تعذر الوصول إلى NVIDIA.',
      };
    }
  });
