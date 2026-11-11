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
  return result.data;
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
