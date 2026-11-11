import { describe, expect, it } from "vitest";
import {
  buildBookmarklet,
  decodeBase64,
  encodeBase64,
  parseImport,
  scoreMatch,
  splitTitle,
} from "../lib/collect";

describe("base64 往返", () => {
  it("中文能原样回来", () => {
    const text = "负责智能硬件产品的功能测试，执行用例 1800+";
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it("容忍 URL-safe 字符和缺失 padding", () => {
    const text = "测试/验证?ok";
    const encoded = encodeBase64(text);
    expect(decodeBase64(encoded)).toBe(text);
  });

  it("乱码返回 null，不抛错", () => {
    expect(decodeBase64("!!!!")).toBeNull();
  });
});

describe("splitTitle", () => {
  it("拆出岗位和公司", () => {
    expect(splitTitle("测试工程师 - 某某科技 - 西安 | BOSS直聘")).toEqual({
      title: "测试工程师",
      company: "某某科技",
    });
  });

  it("只有一段时全部当岗位", () => {
    expect(splitTitle("软件测试")).toEqual({ title: "软件测试", company: "" });
  });

  it("去掉站点后缀", () => {
    expect(splitTitle("测试工程师 - 拉勾").company).not.toContain("拉勾");
  });
});

describe("parseImport", () => {
  it("解析出岗位、公司、JD 文本", () => {
    const payload = { u: "https://example.com/job/1", t: "测试工程师 - 甲公司", x: "岗位职责：负责功能测试" };
    const hash = `#import=${encodeURIComponent(encodeBase64(JSON.stringify(payload)))}`;
    const job = parseImport(hash);
    expect(job?.title).toBe("测试工程师");
    expect(job?.company).toBe("甲公司");
    expect(job?.jd).toContain("功能测试");
    expect(job?.url).toBe("https://example.com/job/1");
  });

  it("没有 import 参数返回 null", () => {
    expect(parseImport("#foo=1")).toBeNull();
  });

  it("内容损坏返回 null", () => {
    expect(parseImport("#import=%E0%A4%A")).toBeNull();
  });
});

describe("scoreMatch", () => {
  it("空查询全部命中", () => {
    expect(scoreMatch("", ["任意"])).toBe(1);
  });

  it("中文按词命中", () => {
    expect(scoreMatch("功能测试", ["负责功能测试与回归测试"])).toBeGreaterThan(0);
    expect(scoreMatch("性能压测", ["负责功能测试"])).toBe(0);
  });

  it("英文不区分大小写", () => {
    expect(scoreMatch("Python", ["用 python 写脚本"])).toBeGreaterThan(0);
  });

  it("命中越多分越高", () => {
    const both = scoreMatch("Linux Python", ["熟悉 Linux，能用 Python 写脚本"]);
    const one = scoreMatch("Linux Python", ["熟悉 Linux"]);
    expect(both).toBeGreaterThan(one);
  });
});

describe("buildBookmarklet", () => {
  it("是可执行的 javascript: 链接，且带上了 origin", () => {
    const code = buildBookmarklet("https://offeralb.vercel.app");
    expect(code.startsWith("javascript:")).toBe(true);
    expect(code).toContain("https://offeralb.vercel.app/app/jobs#import=");
    expect(code).toContain("document.title");
  });
});
