import { SKILLS } from "./skills";

export type Kind = "must" | "nice";

export type Requirement = { text: string; kind: Kind };

export type Term = {
  term: string;
  kind: Kind;
  covered: boolean;
  hits: number;
  source: "dict" | "segment";
  aliases: string[];
};

export type Analysis = {
  coverage: number;
  coveredMust: number;
  totalMust: number;
  mustTerms: Term[];
  niceTerms: Term[];
  requirements: Requirement[];
};

const CJK = /[\u4e00-\u9fa5]/;
const NICE = /(优先|加分|更佳|更好|bonus|preferred|nice\s*to\s*have)/i;
const HEADING = /^[\u4e00-\u9fa5A-Za-z\s]{2,8}[:：]$/;
const CLAUSE_SPLIT = /[，,；;。]/;

/**
 * 停用词：分词会产出大量「负责 / 熟悉 / 相关」这类词，
 * 它们不代表任何可被满足的要求，留着只会让覆盖率虚高。
 */
const STOPWORDS = new Set([
  "岗位", "职责", "要求", "任职", "我们", "以及", "相关", "以上", "以下",
  "优先", "加分", "具备", "熟悉", "掌握", "了解", "负责", "参与", "能够",
  "可以", "良好", "工作", "经验", "能力", "团队", "沟通", "协作", "学历",
  "专业", "本科", "硕士", "博士", "产品", "系统", "平台", "项目", "业务",
  "公司", "部门", "日常", "持续", "完成", "支持", "使用", "常用", "简单",
  "编写", "维护", "跟踪", "关闭", "意识", "测试", "进行", "根据", "通过",
  "或者", "并且", "同时", "其中", "对于", "关于", "包括", "其他",
  "脚本", "流程", "方法", "工具", "手段", "知识", "背景", "年限",
]);

const segmenter = new Intl.Segmenter("zh", { granularity: "word" });

function aliasRegex(alias: string): RegExp {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (CJK.test(alias)) return new RegExp(escaped, "i");
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
}

const SKILL_MATCHERS = SKILLS.map((skill) => ({
  name: skill.name,
  aliases: skill.aliases,
  regexes: skill.aliases.map(aliasRegex),
}));

/**
 * 先按行切，再按标点切成小句。
 * 整行判断会把「有接口测试经验，了解 Postman 者优先」整句归为加分项，
 * 接口测试这个硬性要求就被漏掉了。
 */
export function splitRequirements(jd: string): Requirement[] {
  const out: Requirement[] = [];

  for (const raw of jd.split(/\r?\n/)) {
    const line = raw
      .replace(/^\s*(?:[-*•·]|\d+\s*[.、)）])\s*/, "")
      .replace(/\s+$/, "")
      .trim();

    if (line.length < 3) continue;
    if (!/[\u4e00-\u9fa5A-Za-z]/.test(line)) continue;
    if (HEADING.test(line)) continue;

    for (const piece of line.split(CLAUSE_SPLIT)) {
      const clause = piece.trim();
      if (clause.length < 3) continue;
      if (!/[\u4e00-\u9fa5A-Za-z]/.test(clause)) continue;
      out.push({ text: clause, kind: NICE.test(clause) ? "nice" : "must" });
    }
  }

  return out;
}

function extractFromClause(
  clause: string,
): { term: string; source: "dict" | "segment"; aliases: string[] }[] {
  const out: { term: string; source: "dict" | "segment"; aliases: string[] }[] = [];
  const seen = new Set<string>();

  for (const skill of SKILL_MATCHERS) {
    if (skill.regexes.some((re) => re.test(clause))) {
      const key = skill.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ term: skill.name, source: "dict", aliases: skill.aliases });
      }
    }
  }

  for (const part of segmenter.segment(clause)) {
    if (!part.isWordLike) continue;
    const word = part.segment.trim();
    if (word.length < 2) continue;
    if (/^\d+$/.test(word)) continue;
    if (!CJK.test(word) && !/^[A-Za-z][A-Za-z0-9+#./_-]*$/.test(word)) continue;
    const key = word.toLowerCase();
    if (STOPWORDS.has(word) || seen.has(key)) continue;
    seen.add(key);
    out.push({ term: word, source: "segment", aliases: [word] });
  }

  return out;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containTerm(haystack: string, needle: string): boolean {
  if (CJK.test(needle)) return haystack.includes(needle.toLowerCase());
  const escaped = needle.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
}

/** 覆盖判断走同义词：简历写「自动化脚本」，也该算命中「自动化测试」。 */
function isCovered(aliases: string[], resumeNorm: string): boolean {
  if (!resumeNorm) return false;
  return aliases.some((alias) => containTerm(resumeNorm, alias));
}

function sortTerms(a: Term, b: Term): number {
  if (a.covered !== b.covered) return a.covered ? 1 : -1;
  if (b.hits !== a.hits) return b.hits - a.hits;
  return a.term.localeCompare(b.term, "zh");
}

export function analyze(jd: string, resume: string): Analysis {
  const requirements = splitRequirements(jd);
  const resumeNorm = normalize(resume);
  const map = new Map<
    string,
    { term: string; kind: Kind; hits: number; source: "dict" | "segment"; aliases: string[] }
  >();

  for (const req of requirements) {
    for (const found of extractFromClause(req.text)) {
      const key = found.term.toLowerCase();
      const current = map.get(key);
      if (!current) {
        map.set(key, { ...found, kind: req.kind, hits: 1 });
      } else {
        current.hits += 1;
        if (req.kind === "must") current.kind = "must";
      }
    }
  }

  const all = [...map.values()];
  const dictTerms = all.filter((t) => t.source === "dict");

  const terms: Term[] = [];
  for (const value of all) {
    // 分词切出来的「用例」和词典里的「测试用例」是同一个东西，留词典那个。
    if (
      value.source === "segment" &&
      dictTerms.some((d) => d.term.includes(value.term) || value.term.includes(d.term))
    ) {
      continue;
    }
    // 分词结果只保留在 JD 里出现过两次以上的词，单次出现多半是噪声。
    if (value.source === "segment" && value.hits < 2) continue;

    terms.push({
      term: value.term,
      kind: value.kind,
      hits: value.hits,
      source: value.source,
      aliases: value.aliases,
      covered: isCovered(value.aliases, resumeNorm),
    });
  }

  const mustTerms = terms.filter((t) => t.kind === "must").sort(sortTerms);
  const niceTerms = terms.filter((t) => t.kind === "nice").sort(sortTerms);
  const coveredMust = mustTerms.filter((t) => t.covered).length;
  const totalMust = mustTerms.length;

  return {
    coverage: totalMust ? coveredMust / totalMust : 0,
    coveredMust,
    totalMust,
    mustTerms,
    niceTerms,
    requirements,
  };
}
