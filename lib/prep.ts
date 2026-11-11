import { z } from "zod";
import { chatJSON, extractJSON, LLMError, type LLMConfig } from "./llm";
import { buildPrepUser, PREP_SYSTEM } from "../prompts/prep";

export const PrepSchema = z.object({
  pitch: z.string().min(1).max(80),
  numbers: z
    .array(z.object({ value: z.string().min(1), context: z.string().min(1) }))
    .max(3)
    .default([]),
  questions: z
    .array(
      z.object({
        q: z.string().min(1),
        type: z.enum(["技术", "项目", "行为", "反问"]),
        why: z.string().min(1),
        evidence: z.string().min(1),
        outline: z.array(z.string().min(1)).min(1).max(4),
      }),
    )
    .min(1)
    .max(12),
  deepDives: z
    .array(z.object({ topic: z.string().min(1), levels: z.array(z.string().min(1)).length(3) }))
    .max(4)
    .default([]),
  redlines: z.array(z.string().min(1)).max(3).default([]),
});

export type Prep = z.infer<typeof PrepSchema>;

const NUMBER = /\d+(?:\.\d+)?%?/g;

/** 0 和 1 在文本里几乎都是「0 到 1」「第一层」这类结构词，不是业绩数字。 */
const IGNORED = new Set(["0", "1"]);

function numbers(text: string): Set<string> {
  const set = new Set<string>();
  for (const n of text.match(NUMBER) ?? []) {
    const value = n.replace(/%$/, "");
    if (!IGNORED.has(value)) set.add(value);
  }
  return set;
}

/** 面试包里所有会念出来的数字，都必须能在简历里找到出处。 */
export function auditPrepNumbers(prep: Prep, resume: string): string[] {
  const source = numbers(resume);
  const extra: string[] = [];

  const scan = (text: string) => {
    for (const n of numbers(text)) {
      if (!source.has(n) && !extra.includes(n)) extra.push(n);
    }
  };

  for (const item of prep.numbers) {
    scan(item.value);
    scan(item.context);
  }
  for (const q of prep.questions) {
    scan(q.evidence);
    q.outline.forEach(scan);
  }
  for (const d of prep.deepDives) d.levels.forEach(scan);

  return extra;
}

export function parsePrep(text: string, resume: string): { prep: Prep; fabricated: string[] } {
  const raw = extractJSON(text);
  const result = PrepSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new LLMError(`模型输出不符合结构：${issue?.path.join(".") || "未知字段"} ${issue?.message ?? ""}`);
  }
  const prep = result.data;
  return { prep, fabricated: auditPrepNumbers(prep, resume) };
}

export async function requestPrep(args: {
  config: LLMConfig;
  jd: string;
  resume: string;
}): Promise<{ prep: Prep; fabricated: string[] }> {
  const text = await chatJSON({
    config: args.config,
    system: PREP_SYSTEM,
    user: buildPrepUser({ jd: args.jd, resume: args.resume }),
    timeoutMs: 90_000,
    maxTokens: 3200,
  });
  return parsePrep(text, args.resume);
}
