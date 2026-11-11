import { describe, expect, it } from "vitest";
import { extractJSON } from "../lib/llm";
import { InsightSchema, parseInsight } from "../lib/insight";

const VALID = {
  verdict: "自动化与工具链匹配，缺接口测试的直接证据",
  strengths: [{ point: "有 152 条自动化用例", evidence: "在自动化平台编写 152 条用例" }],
  gaps: [
    {
      term: "接口测试",
      level: "weak",
      reason: "简历只提到接口自动化脚本，没有接口测试方案或工具链证据",
      action: "一周",
      suggestion: "补一个 Postman/HTTPX 的接口测试小项目，写清断言与数据构造",
    },
  ],
  semanticHits: [{ requirement: "缺陷管理流程", evidence: "提交缺陷 200+，跟踪至关闭" }],
};

describe("extractJSON", () => {
  it("能剥离 Markdown 代码块", () => {
    const text = "```json\n{\"a\":1}\n```";
    expect(extractJSON(text)).toEqual({ a: 1 });
  });

  it("前后有多余的话也能摘出来", () => {
    expect(extractJSON("好的，结果如下：{\"a\":2} 希望有帮助")).toEqual({ a: 2 });
  });

  it("没有 JSON 时抛错", () => {
    expect(() => extractJSON("抱歉，我无法完成")).toThrow();
  });
});

describe("InsightSchema", () => {
  it("接受合法结构", () => {
    expect(InsightSchema.safeParse(VALID).success).toBe(true);
  });

  it("拒绝非法的 level", () => {
    const bad = { ...VALID, gaps: [{ ...VALID.gaps[0], level: "high" }] };
    expect(InsightSchema.safeParse(bad).success).toBe(false);
  });

  it("拒绝非法的 action", () => {
    const bad = { ...VALID, gaps: [{ ...VALID.gaps[0], action: "下个月" }] };
    expect(InsightSchema.safeParse(bad).success).toBe(false);
  });

  it("允许空数组", () => {
    const minimal = { verdict: "结论", strengths: [], gaps: [], semanticHits: [] };
    expect(InsightSchema.safeParse(minimal).success).toBe(true);
  });
});

describe("parseInsight", () => {
  it("把带代码块的输出解析成对象", () => {
    const parsed = parseInsight("```json\n" + JSON.stringify(VALID) + "\n```");
    expect(parsed.verdict).toContain("自动化");
    expect(parsed.gaps[0].action).toBe("一周");
  });

  it("结构不对时报出字段名", () => {
    expect(() => parseInsight(JSON.stringify({ verdict: "" }))).toThrow(/verdict/);
  });
});
