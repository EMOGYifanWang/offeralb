import { NextResponse } from "next/server";
import { getLLMConfig, LLMError } from "@/lib/llm";
import { requestTailor } from "@/lib/tailor";
import { TAILOR_PROMPT_VERSION } from "@/prompts/tailor";

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
    return NextResponse.json({ error: "先贴一段简历，才有东西可改" }, { status: 400 });
  }

  const startedAt = Date.now();
  try {
    const { tailor, fabricated, fabricatedSkills } = await requestTailor({ config, jd, resume });
    return NextResponse.json({
      tailor,
      audit: { fabricated, fabricatedSkills },
      meta: {
        model: config.model,
        promptVersion: TAILOR_PROMPT_VERSION,
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const message = error instanceof LLMError ? error.message : "模型调用失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
