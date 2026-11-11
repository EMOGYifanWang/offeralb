import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";

export async function POST(request: Request) {
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
  if (jd.length > 20000) {
    return NextResponse.json({ error: "JD 太长了，先截到 2 万字以内" }, { status: 413 });
  }

  return NextResponse.json(analyze(jd, typeof resume === "string" ? resume : ""));
}
