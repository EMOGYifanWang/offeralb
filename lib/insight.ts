import { z } from "zod";
import { chatJSON, extractJSON, LLMError, type LLMConfig } from "./llm";
import { buildUser, SYSTEM } from "../prompts/analyze";
import type { Analysis } from "./analyze";

export const InsightSchema = z.object({
  verdict: z.string().min(1).max(80),
  strengths: z
    .array(z.object({ point: z.string().min(1), evidence: z.string().min(1) }))
    .max(4)
    .default([]),
  gaps: z
    .array(
      z.object({
        term: z.string().min(1),
        level: z.enum(["strong", "weak", "none"]),
        reason: z.string().min(1),
        action: z.enum(["今天", "一周", "补不了"]),
        suggestion: z.string().min(1),
      }),
    )
    .max(6)
    .default([]),
  semanticHits: z
    .array(z.object({ requirement: z.string().min(1), evidence: z.string().min(1) }))
    .max(4)
    .default([]),
});

export type Insight = z.infer<typeof InsightSchema>;

export function parseInsight(text: string): Insight {
  const raw = extractJSON(text);
  const result = InsightSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new LLMError(`模型输出不符合结构：${issue?.path.join(".") || "未知字段"} ${issue?.message ?? ""}`);
  }

  const data = result.data;
  // 模型偶尔把已满足的要求也塞进 gaps（还标 strong），这里兜一层：
  // 已满足的归 strengths，不占缺口位。
  const seen = new Set<string>();
  const gaps = data.gaps.filter((gap) => {
    if (gap.level === "strong") return false;
    const key = gap.term.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { ...data, gaps };
}

/**
 * 只跑一次，失败由调用方决定是否重试。
 * 重试放在路由层是为了让前端能拿到「第一次失败、第二次成功」的痕迹。
 */
export async function requestInsight(args: {
  config: LLMConfig;
  jd: string;
  resume: string;
  analysis: Analysis;
}): Promise<Insight> {
  const { analysis } = args;
  const user = buildUser({
    jd: args.jd,
    resume: args.resume,
    unmet: analysis.mustTerms.filter((t) => !t.covered).map((t) => t.term),
    met: analysis.mustTerms.filter((t) => t.covered).map((t) => t.term),
    nice: analysis.niceTerms.map((t) => t.term),
  });

  const text = await chatJSON({ config: args.config, system: SYSTEM, user });
  return parseInsight(text);
}
