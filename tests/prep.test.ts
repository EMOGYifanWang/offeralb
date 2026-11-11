import { describe, expect, it } from "vitest";
import { auditPrepNumbers, parsePrep, PrepSchema } from "../lib/prep";

const RESUME = "3 年软件测试经验。负责 5 个版本回归测试，执行用例 1800+，提交缺陷 200+。";

const VALID = {
  pitch: "3 年智能硬件测试，能写 Python 脚本",
  numbers: [{ value: "1800+", context: "累计执行用例" }],
  questions: [
    {
      q: "你那个 5 个版本的回归是怎么排的？",
      type: "项目",
      why: "想看版本管理能力",
      evidence: "负责 5 个版本的回归测试",
      outline: ["按版本风险排优先级", "每轮回归前确认改动范围"],
    },
  ],
  deepDives: [
    { topic: "5 个版本回归测试", levels: ["是什么", "怎么排的", "漏测了怎么办"] },
  ],
  redlines: ["不要说精通 JMeter"],
};

describe("auditPrepNumbers", () => {
  it("简历里有的数字不报警", () => {
    const prep = PrepSchema.parse(VALID);
    expect(auditPrepNumbers(prep, RESUME)).toEqual([]);
  });

  it("答题要点里编的数字会被抓出来", () => {
    const prep = PrepSchema.parse({
      ...VALID,
      questions: [{ ...VALID.questions[0], outline: ["覆盖 3200 条用例"] }],
    });
    expect(auditPrepNumbers(prep, RESUME)).toContain("3200");
  });

  it("追问链里的数字也查", () => {
    const prep = PrepSchema.parse({
      ...VALID,
      deepDives: [{ topic: "回归", levels: ["5 个版本", "执行 1800+", "缺陷 999 个"] }],
    });
    expect(auditPrepNumbers(prep, RESUME)).toContain("999");
  });

  it("0 和 1 当作结构词，不算编造", () => {
    const prep = PrepSchema.parse({
      ...VALID,
      questions: [{ ...VALID.questions[0], outline: ["从 0 到 1 搭建回归体系", "第 1 周先看文档"] }],
    });
    expect(auditPrepNumbers(prep, RESUME)).toEqual([]);
  });
});

describe("PrepSchema", () => {
  it("接受合法结构", () => {
    expect(PrepSchema.safeParse(VALID).success).toBe(true);
  });

  it("拒绝未知题型", () => {
    const bad = { ...VALID, questions: [{ ...VALID.questions[0], type: "闲聊" }] };
    expect(PrepSchema.safeParse(bad).success).toBe(false);
  });

  it("追问链必须三层", () => {
    const bad = { ...VALID, deepDives: [{ topic: "x", levels: ["只有一层"] }] };
    expect(PrepSchema.safeParse(bad).success).toBe(false);
  });
});

describe("parsePrep", () => {
  it("解析正常输出", () => {
    const { prep, fabricated } = parsePrep(JSON.stringify(VALID), RESUME);
    expect(prep.questions[0].type).toBe("项目");
    expect(fabricated).toEqual([]);
  });

  it("结构不对时报字段名", () => {
    expect(() => parsePrep(JSON.stringify({ pitch: "" }), RESUME)).toThrow(/pitch/);
  });
});
