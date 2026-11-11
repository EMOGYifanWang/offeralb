import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { getLLMConfig, LLMError } from "@/lib/llm";
import { requestInsight } from "@/lib/insight";
import { PROMPT_VERSION } from "@/prompts/analyze";

export const maxDuration = 60;

export async function POST(request: Request) {
  const config = getLLMConfig();
  if (!config) {
    return NextResponse.json(
      { error: "还没配置模型：把 DEEPSEEK_API_KEY 写进 .env.local 再重启" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const { jd, resume } = (body ?? {}) as { jd?: unknown; resume?: unknown };
  if (typeof jd !== "string" || !jd.trim()) {
    return NextResponse.json({ error: "JD 不能为空" }, { status: 400 });
  }
  if (typeof resume !== "string" || !resume.trim()) {
    return NextResponse.json({ error: "先贴一段简历，模型才有东西可判" }, { status: 400 });
  }

  const analysis = analyze(jd, typeof resume === "string" ? resume : "");
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const insight = await requestInsight({ config, jd, resume, analysis });
      return NextResponse.json({
        insight,
        meta: {
          model: config.model,
          promptVersion: PROMPT_VERSION,
          attempt,
          durationMs: Date.now() - startedAt,
        },
      });
    } catch (error) {
      const message = error instanceof LLMError ? error.message : "模型调用失败";
      const retryable = !(error instanceof LLMError && error.status === 401);
      if (attempt === 2 || !retryable) {
        const status = error instanceof LLMError && error.status ? 502 : 502;
        return NextResponse.json({ error: message, attempts: attempt }, { status });
      }
    }
  }

  return NextResponse.json({ error: "模型调用失败" }, { status: 502 });
}
