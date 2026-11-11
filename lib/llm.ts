export type LLMConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

export class LLMError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LLMError";
    this.status = status;
  }
}

export function getLLMConfig(): LLMConfig | null {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    baseUrl: (process.env.LLM_BASE_URL ?? "https://api.deepseek.com/v1").replace(/\/+$/, ""),
    model: process.env.LLM_MODEL ?? "deepseek-chat",
    apiKey,
  };
}

/** 从模型输出里摘出 JSON：容忍代码块包裹、前后多话。 */
export function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new LLMError("模型输出里没有 JSON");
  }
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new LLMError("模型输出的 JSON 解析失败");
  }
}

/** 供应商错误体五花八门，能抠出 message 就抠，抠不出就截断原文。 */
function providerMessage(body: string): string {
  if (!body) return "";
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // 不是 JSON，走截断
  }
  return body.slice(0, 160);
}

export async function chatJSON(args: {
  config: LLMConfig;
  system: string;
  user: string;
  timeoutMs?: number;
  maxTokens?: number;
}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 45_000);

  try {
    const response = await fetch(`${args.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: args.config.model,
        temperature: 0.2,
        max_tokens: args.maxTokens ?? 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const detail = providerMessage(body);
      const prefix =
        response.status === 401
          ? "API key 无效或已过期（401），检查 .env.local 里的 DEEPSEEK_API_KEY"
          : response.status === 402
            ? "账户余额不足（402）"
            : response.status === 429
              ? "请求太频繁（429），等一会儿再试"
              : `模型返回 ${response.status}`;
      throw new LLMError(`${prefix}${detail ? `：${detail}` : ""}`, response.status);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
    };
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (!content) throw new LLMError("模型没有返回内容");
    if (choice?.finish_reason === "length") {
      throw new LLMError("模型输出被截断：这次要写的内容超过了 max_tokens，减少题目数量或调大上限");
    }
    return content;
  } catch (error) {
    if (error instanceof LLMError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new LLMError("模型超时，45 秒内没有返回");
    }
    throw new LLMError(error instanceof Error ? error.message : "模型调用失败");
  } finally {
    clearTimeout(timer);
  }
}
