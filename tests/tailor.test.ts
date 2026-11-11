import { describe, expect, it } from "vitest";
import { auditNumbers, auditSkills, parseTailor, TailorSchema } from "../lib/tailor";

const VALID = {
  headline: "2 年 IoT 测试，覆盖功能与自动化",
  bullets: [
    {
      original: "负责 5 个版本的回归测试，累计执行用例 1800+",
      rewritten: "独立负责 5 个版本回归测试，累计执行 1800+ 条用例，保障版本按期交付",
      reason: "把「负责」强化为独立负责，并补出交付结果",
    },
  ],
  warnings: [],
};

describe("auditNumbers", () => {
  it("没有新增数字时返回空", () => {
    expect(auditNumbers("执行 1800+ 条用例", "累计执行用例 1800+")).toEqual([]);
  });

  it("抓出编造的数字", () => {
    expect(auditNumbers("执行 2600+ 条用例", "累计执行用例 1800+")).toEqual(["2600"]);
  });

  it("百分号按数值比较", () => {
    expect(auditNumbers("缺陷率下降 30%", "缺陷率下降 30")).toEqual([]);
  });

  it("小数也能比", () => {
    expect(auditNumbers("耗时下降 12.5%", "耗时下降 12.5%")).toEqual([]);
  });

  it("多个新增数字去重", () => {
    expect(auditNumbers("2600 条用例、40 个模块", "1800 条用例")).toEqual(["2600", "40"]);
  });
});

describe("auditSkills", () => {
  it("简历没写过的技能会被抓出来", () => {
    expect(auditSkills("主要做功能测试与兼容性测试", "主要做功能测试")).toContain("兼容性测试");
  });

  it("原句里有的技能不报警", () => {
    expect(auditSkills("熟悉 Linux 命令", "熟悉 Linux 与抓包工具")).toEqual([]);
  });

  it("同族技能不误判：Java 不能靠 JavaScript 蒙混", () => {
    expect(auditSkills("熟悉 Java", "写过 JavaScript")).toEqual(["Java"]);
    expect(auditSkills("熟悉 JavaScript", "写过 Java")).toEqual(["JavaScript"]);
  });

  it("同义词算命中：自动化脚本够得上自动化测试", () => {
    expect(auditSkills("参与自动化测试", "写过自动化脚本")).toEqual([]);
  });
});

describe("TailorSchema", () => {
  it("接受合法结构", () => {
    expect(TailorSchema.safeParse(VALID).success).toBe(true);
  });

  it("拒绝空 bullets", () => {
    expect(TailorSchema.safeParse({ ...VALID, bullets: [] }).success).toBe(false);
  });

  it("拒绝超过 6 条", () => {
    const many = { ...VALID, bullets: Array.from({ length: 7 }, () => VALID.bullets[0]) };
    expect(TailorSchema.safeParse(many).success).toBe(false);
  });
});

describe("parseTailor", () => {
  it("解析正常输出，且没有编造", () => {
    const { tailor, fabricated } = parseTailor(JSON.stringify(VALID), "累计执行用例 1800+");
    expect(tailor.bullets).toHaveLength(1);
    expect(fabricated).toEqual([]);
  });

  it("标出编造的数字", () => {
    const bad = {
      ...VALID,
      bullets: [{ ...VALID.bullets[0], rewritten: "累计执行 2600+ 条用例" }],
    };
    const { fabricated } = parseTailor(JSON.stringify(bad), "累计执行用例 1800+");
    expect(fabricated).toContain("2600");
  });

  it("结构不对时报字段名", () => {
    expect(() => parseTailor(JSON.stringify({ headline: "" }), "")).toThrow(/headline/);
  });
});
