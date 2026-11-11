import Link from "next/link";
import results from "@/eval/results.json";

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
  mode: string;
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

const data = results as Results;

function pct(value: number | null): string {
  return value === null ? "待补充" : `${(value * 100).toFixed(1)}%`;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{note}</p>
    </div>
  );
}

export default function EvalPage() {
  const m = data.metrics;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-xs font-medium tracking-[0.2em] text-neutral-500">
          OFFERLAB
        </Link>
        <span className="text-xs text-neutral-400">评测结果</span>
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">数字从哪来</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
        页面上的每个数字都由 <code className="text-xs">npm run eval</code> 产出，写进{" "}
        <code className="text-xs">eval/results.json</code>，再原样渲染到这里。这张表对应的 commit 是{" "}
        <code className="text-xs">{data.commit}</code>。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="关键词精确率"
          value={pct(m.keyword_precision)}
          note={`${data.dataset.cases} 条自建 JD 上，提取的硬性关键词里有多少是人工标注里的`}
        />
        <Stat
          label="关键词召回率"
          value={pct(m.keyword_recall)}
          note="人工标注的硬性关键词里，有多少被提取出来"
        />
        <Stat
          label="覆盖率中位数"
          value={pct(m.coverage_median)}
          note="同一份简历对不同岗位的硬性要求覆盖率，取中位数"
        />
        <Stat
          label="结构化合法率"
          value={pct(m.schema_valid_rate)}
          note={`模型输出通过 Zod 校验的比例（live ${data.dataset.liveCases} 条 × 2 次调用）`}
        />
        <Stat
          label="单岗位耗时"
          value={m.time_per_job_ms === null ? "待补充" : `${(m.time_per_job_ms / 1000).toFixed(1)}s`}
          note="分析与定制两次调用的中位数，不含人工确认"
        />
        <Stat
          label="编造拦截"
          value={m.fabrication_flags === null ? "待补充" : `${m.fabrication_flags} 处`}
          note="数字闸与技能闸在 live 跑里拦下的新增数字 / 技能"
        />
      </div>

      <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-medium text-amber-900">这张表的局限，先说清楚</p>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-amber-800">
          <li>· 用例只有 {data.dataset.cases} 条，且是我自己写的——它证明的是行为一致，不是泛化能力。</li>
          <li>· 精确率 100% 有必然性：标注和技能词典同源，词典里有的词才可能被提取。</li>
          <li>· 编造拦截为 0 只说明这批输入没触发，不说明模型不会编——它随时可能。</li>
          <li>· 耗时取的是中位数，首字节延迟受网络影响，波动可能很大。</li>
        </ul>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-neutral-800">逐条结果</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="py-2 pr-4 font-medium">用例</th>
                <th className="py-2 pr-4 font-medium">精确率</th>
                <th className="py-2 pr-4 font-medium">召回率</th>
                <th className="py-2 pr-4 font-medium">覆盖率</th>
                <th className="py-2 font-medium">漏标 / 多标</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.perCase.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-4">
                    <span className="text-neutral-900">{c.title}</span>
                    <span className="ml-2 text-neutral-400">{c.id}</span>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{pct(c.precision)}</td>
                  <td className="py-2 pr-4 tabular-nums">{pct(c.recall)}</td>
                  <td className="py-2 pr-4 tabular-nums">{pct(c.coverage)}</td>
                  <td className="py-2 text-neutral-500">
                    {c.missed.length ? `漏 ${c.missed.join("、")}` : ""}
                    {c.missed.length && c.extra.length ? "；" : ""}
                    {c.extra.length ? `多 ${c.extra.join("、")}` : ""}
                    {!c.missed.length && !c.extra.length ? "—" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[11px] text-neutral-400">
          模式 {data.mode} · 模型 {data.model ?? "未调用"} · 生成于{" "}
          {new Date(data.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
        </p>
      </div>
    </main>
  );
}
