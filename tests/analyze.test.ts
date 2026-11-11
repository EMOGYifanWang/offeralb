import { describe, expect, it } from "vitest";
import { analyze, splitRequirements } from "../lib/analyze";

const JD = `岗位职责：
1. 负责智能硬件产品的功能测试、兼容性测试与回归测试；
2. 编写测试用例并执行，跟踪缺陷直至关闭。
任职要求：
1. 本科及以上学历，2 年以上软件测试经验；
2. 熟悉 Linux 常用命令，能使用 Python 编写简单脚本；
3. 有接口测试经验，了解 Postman、JMeter 者优先。`;

describe("splitRequirements", () => {
  it("去掉列表序号和小标题", () => {
    const rows = splitRequirements(JD);
    expect(rows.some((r) => r.text.startsWith("岗位职责"))).toBe(false);
    expect(rows[0].text).toContain("功能测试");
  });

  it("一行里混着硬性要求和加分项时，按小句拆开", () => {
    const rows = splitRequirements("有接口测试经验，了解 Postman、JMeter 者优先。");
    const kinds = rows.map((r) => r.kind);
    expect(rows).toHaveLength(2);
    expect(kinds).toEqual(["must", "nice"]);
    expect(rows[0].text).toContain("接口测试");
  });
});

describe("analyze", () => {
  it("识别词典术语并计算覆盖", () => {
    const result = analyze(JD, "熟悉 Linux，用 Python 写过测试脚本。");
    const names = result.mustTerms.map((t) => t.term);
    expect(names).toContain("Linux");
    expect(names).toContain("Python");
    expect(names).toContain("接口测试");
    expect(result.coveredMust).toBeGreaterThanOrEqual(2);
    expect(result.coverage).toBeGreaterThan(0);
  });

  it("同义词也算命中：自动化脚本 → 自动化测试", () => {
    const result = analyze("要求熟悉自动化测试", "写过自动化脚本，跑过回归。");
    const term = result.mustTerms.find((t) => t.term === "自动化测试");
    expect(term?.covered).toBe(true);
  });

  it("词典术语不会被分词结果重复计一次", () => {
    const result = analyze("编写测试用例\n维护测试用例", "执行过测试用例");
    const names = result.mustTerms.map((t) => t.term);
    expect(names).toContain("测试用例");
    expect(names).not.toContain("用例");
  });

  it("符号边界不误判", () => {
    const result = analyze("要求熟悉 Java", "我写过 JavaScript");
    const java = result.mustTerms.find((t) => t.term === "Java");
    expect(java?.covered).toBe(false);
  });

  it("空简历时覆盖率为 0", () => {
    const result = analyze(JD, "");
    expect(result.coverage).toBe(0);
    expect(result.totalMust).toBeGreaterThan(0);
  });

  it("空 JD 返回空结果", () => {
    const result = analyze("", "随便写点");
    expect(result.totalMust).toBe(0);
    expect(result.coverage).toBe(0);
    expect(result.requirements).toHaveLength(0);
  });

  it("同一个词不会被重复计数", () => {
    const result = analyze("熟悉 Linux\n熟悉 Linux 命令", "熟悉 Linux");
    const linux = result.mustTerms.filter((t) => t.term === "Linux");
    expect(linux).toHaveLength(1);
    expect(linux[0].hits).toBe(2);
  });
});
