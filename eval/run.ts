import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CASES } from "./dataset";

type CaseMetric = {
  id: string;
  title: string;
  precision: number;
  recall: number;
  coverage: number;
  extracted: string[];
  missed: string[];
  extra: string[];
};

type Results = {
  generatedAt: string;
  commit: string;
  mode: "offline" | "offline+live";
  model?: string;
  dataset: { cases: number; liveCases: number };
  metrics: {
    keyword_precision: number;
    keyword_recall: number;
    coverage_median: number;
    schema_valid_rate: number | null;
    time_per_job_ms: number | null;
    fabrication_flags: number | null;
  };
  perCase: CaseMetric[];
};

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "eval", "results.json");

function loadEnv(): void {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function commit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function norm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  // 这里不能四舍五入：比例类指标会被舍成 0 或 1。
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  loadEnv();

  const { analyze } = await import("../lib/analyze");

  const perCase: CaseMetric[] = [];
  let hits = 0;
  let extractedTotal = 0;
  let expectedTotal = 0;

  for (const item of CASES) {
    const analysis = analyze(item.jd, item.resume);
    const expected = new Set(item.must.map(norm));
    const extracted = new Set(analysis.mustTerms.map((t) => norm(t.term)));

    const hit = [...extracted].filter((t) => expected.has(t));
    hits += hit.length;
    extractedTotal += extracted.size;
    expectedTotal += expected.size;

    perCase.push({
      id: item.id,
      title: item.title,
      precision: Number((hit.length / Math.max(extracted.size, 1)).toFixed(3)),
      recall: Number((hit.length / Math.max(expected.size, 1)).toFixed(3)),
      coverage: Number(analysis.coverage.toFixed(3)),
      extracted: [...extracted],
      missed: [...expected].filter((t) => !extracted.has(t)),
      extra: [...extracted].filter((t) => !expected.has(t)),
    });
  }

  const results: Results = {
    generatedAt: new Date().toISOString(),
    commit: commit(),
    mode: "offline",
    dataset: { cases: CASES.length, liveCases: 0 },
    metrics: {
      keyword_precision: Number((hits / Math.max(extractedTotal, 1)).toFixed(3)),
      keyword_recall: Number((hits / Math.max(expectedTotal, 1)).toFixed(3)),
      coverage_median: Number(median(perCase.map((c) => c.coverage)).toFixed(3)),
      schema_valid_rate: null,
      time_per_job_ms: null,
      fabrication_flags: null,
    },
    perCase,
  };

  // 模型相关的指标只在前 3 条上跑，控制成本；没有 key 就跳过，不假装跑过。
  if (live) {
    const { getLLMConfig } = await import("../lib/llm");
    const { requestInsight } = await import("../lib/insight");
    const { requestTailor } = await import("../lib/tailor");
    const config = getLLMConfig();

    if (!config) {
      console.log("⚠ 没找到 DEEPSEEK_API_KEY，跳过 live 指标（结果里保持 null）");
    } else {
      const sample = CASES.slice(0, 3);
      let attempts = 0;
      let valid = 0;
      let fabricated = 0;
      const durations: number[] = [];

      for (const item of sample) {
        const started = Date.now();
        try {
          const analysis = analyze(item.jd, item.resume);
          await requestInsight({ config, jd: item.jd, resume: item.resume, analysis });
          valid += 1;
        } catch (error) {
          console.log(`  insight 失败 ${item.id}: ${(error as Error).message}`);
        }
        try {
          const { fabricated: numbers, fabricatedSkills } = await requestTailor({
            config,
            jd: item.jd,
            resume: item.resume,
          });
          valid += 1;
          fabricated += numbers.length + fabricatedSkills.length;
        } catch (error) {
          console.log(`  tailor 失败 ${item.id}: ${(error as Error).message}`);
        }
        attempts += 2;
        durations.push(Date.now() - started);
      }

      results.mode = "offline+live";
      results.model = config.model;
      results.dataset.liveCases = sample.length;
      results.metrics.schema_valid_rate = Number((valid / Math.max(attempts, 1)).toFixed(3));
      results.metrics.time_per_job_ms = Math.round(median(durations));
      results.metrics.fabrication_flags = fabricated;
    }
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(results, null, 2)}\n`, "utf8");

  const m = results.metrics;
  console.log("\nOfferLab eval");
  console.log(`  用例            ${results.dataset.cases} 条${live ? `（live ${results.dataset.liveCases} 条）` : ""}`);
  console.log(`  关键词精确率    ${(m.keyword_precision * 100).toFixed(1)}%`);
  console.log(`  关键词召回率    ${(m.keyword_recall * 100).toFixed(1)}%`);
  console.log(`  覆盖率中位数    ${(m.coverage_median * 100).toFixed(1)}%`);
  if (m.schema_valid_rate !== null) {
    console.log(`  结构化合法率    ${(m.schema_valid_rate * 100).toFixed(1)}%`);
    console.log(`  单岗位耗时      ${((m.time_per_job_ms ?? 0) / 1000).toFixed(1)}s（中位数，分析+定制）`);
    console.log(`  编造拦截        ${m.fabrication_flags} 处`);
  } else {
    console.log("  模型指标        未跑（加 --live 且配置 key）");
  }
  console.log(`\n  写入 ${path.relative(ROOT, OUT)}`);

  for (const c of results.perCase) {
    if (c.missed.length) console.log(`  · ${c.id} 漏标: ${c.missed.join("、")}`);
    if (c.extra.length) console.log(`  · ${c.id} 多标: ${c.extra.join("、")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
