import { z } from "zod";
import { chatJSON, extractJSON, LLMError, type LLMConfig } from "./llm";
import { buildTailorUser, TAILOR_SYSTEM } from "../prompts/tailor";
import { SKILLS } from "./skills";

export const TailorSchema = z.object({
  headline: z.string().min(1).max(40),
  bullets: z
    .array(
      z.object({
        original: z.string().min(1),
        rewritten: z.string().min(1).max(120),
        reason: z.string().min(1),
      }),
    )
    .min(1)
    .max(6),
  warnings: z.array(z.string()).max(3).default([]),
});

export type Tailor = z.infer<typeof TailorSchema>;

const NUMBER = /\d+(?:\.\d+)?%?/g;

function numbers(text: string): Set<string> {
  return new Set((text.match(NUMBER) ?? []).map((n) => n.replace(/%$/, "")));
}

/**
 * 事实锁第一道闸：改写句里出现的数字，必须在原句或简历里出现过。
 * 只查数字是因为它最容易编、也最容易被人当场抓住。
 */
export function auditNumbers(rewritten: string, allowed: string): string[] {
  const source = numbers(allowed);
  const extra: string[] = [];
  for (const n of numbers(rewritten)) {
    if (!source.has(n) && !extra.includes(n)) extra.push(n);
  }
  return extra;
}

const CJK = /[\u4e00-\u9fa5]/;

function mentions(text: string, alias: string): boolean {
  if (CJK.test(alias)) return text.includes(alias);
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i").test(text);
}

/**
 * 事实锁第二道闸：改写里出现的技能，简历原文里必须有过。
 * 数字查不出「悄悄加了一个兼容性测试」，技能词典能。
 */
export function auditSkills(rewritten: string, resume: string): string[] {
  const hits: string[] = [];
  for (const skill of SKILLS) {
    const inRewrite = skill.aliases.some((alias) => mentions(rewritten, alias));
    if (!inRewrite) continue;
    const inResume = skill.aliases.some((alias) => mentions(resume, alias));
    if (!inResume) hits.push(skill.name);
  }
  return hits;
}

export function parseTailor(
  text: string,
  resume: string,
): { tailor: Tailor; fabricated: string[]; fabricatedSkills: string[] } {
  const raw = extractJSON(text);
  const result = TailorSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new LLMError(`模型输出不符合结构：${issue?.path.join(".") || "未知字段"} ${issue?.message ?? ""}`);
  }

  const tailor = result.data;
  const fabricated: string[] = [];
  const fabricatedSkills: string[] = [];
  for (const bullet of tailor.bullets) {
    for (const n of auditNumbers(bullet.rewritten, `${resume}\n${bullet.original}`)) {
      if (!fabricated.includes(n)) fabricated.push(n);
    }
    for (const s of auditSkills(bullet.rewritten, resume)) {
      if (!fabricatedSkills.includes(s)) fabricatedSkills.push(s);
    }
  }

  return { tailor, fabricated, fabricatedSkills };
}

export async function requestTailor(args: {
  config: LLMConfig;
  jd: string;
  resume: string;
}): Promise<{ tailor: Tailor; fabricated: string[]; fabricatedSkills: string[] }> {
  const text = await chatJSON({
    config: args.config,
    system: TAILOR_SYSTEM,
    user: buildTailorUser({ jd: args.jd, resume: args.resume }),
    timeoutMs: 60_000,
  });
  return parseTailor(text, args.resume);
}
