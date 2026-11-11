import Link from "next/link";
import analyzeData from "@/data/replay/analyze.json";
import insightData from "@/data/replay/insight.json";
import tailorData from "@/data/replay/tailor.json";
import prepData from "@/data/replay/prep.json";
import type { Analysis } from "@/lib/analyze";
import type { Insight } from "@/lib/insight";
import type { Tailor } from "@/lib/tailor";
import type { Prep } from "@/lib/prep";

const analysis = analyzeData as unknown as Analysis;
const insight = (insightData as { insight: Insight }).insight;
const tailor = (tailorData as { tailor: Tailor }).tailor;
const prep = (prepData as { prep: Prep }).prep;

const JD_TITLE = "测试工程师 · 智能硬件";
const CANDIDATE = "张伟 · 3 年软件测试";

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium tracking-[0.18em] text-neutral-400">{children}</p>;
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  const { only } = await searchParams;
  const pct = Math.round(analysis.coverage * 100);
  const missing = analysis.mustTerms.filter((t) => !t.covered);
  const covered = analysis.mustTerms.filter((t) => t.covered);

  return (
    <main className={only ? "mx-auto max-w-4xl px-6 py-8" : "mx-auto max-w-4xl px-6 py-12"}>
      {!only && (
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs font-medium tracking-[0.2em] text-neutral-500">
            OFFERLAB
          </Link>
          <span className="text-xs text-neutral-400">示例回放 · 不需要 API key</span>
        </div>
      )}

      {!only && (
        <div className="mt-10 border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">一份 JD，从分析到备战</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {JD_TITLE} · {CANDIDATE}。下面所有内容都是真实模型输出，预先跑好后存成 JSON，打开即可看。
          </p>
        </div>
      )}

      {/* 分析 */}
      {(!only || only === "analyze") && (
        <section
          id="analyze"
          className={`scroll-mt-8 border-b border-neutral-200 py-10 ${only ? "pt-0" : ""}`}
        >
        <Kicker>01 · 竞争力分析</Kicker>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-4xl font-semibold tabular-nums">{pct}%</p>
            <p className="mt-1 text-xs text-neutral-500">
              硬性要求 {analysis.coveredMust}/{analysis.totalMust} 项命中
            </p>
          </div>
          <p className="max-w-sm text-right text-sm text-neutral-700">{insight.verdict}</p>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-neutral-900" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-neutral-500">缺口（{missing.length}）</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missing.map((t) => (
                <span key={t.term} className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-800">
                  {t.term}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-500">已命中（{covered.length}）</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {covered.map((t) => (
                <span
                  key={t.term}
                  className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
                >
                  {t.term}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 divide-y divide-neutral-100">
          {insight.gaps.slice(0, 3).map((g) => (
            <div key={g.term} className="py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{g.term}</span>
                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                  {g.level === "none" ? "没证据" : "证据弱"}
                </span>
                <span className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-600">
                  {g.action}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{g.suggestion}</p>
            </div>
          ))}
        </div>
        </section>
      )}

      {/* 定制 */}
      {(!only || only === "tailor") && (
        <section id="tailor" className="scroll-mt-8 border-b border-neutral-200 py-10">
        <Kicker>02 · 简历定制</Kicker>
        <p className="mt-3 text-base font-medium">{tailor.headline}</p>
        <p className="mt-1 text-xs text-neutral-500">
          每条改写都挂原文，数字和技能逐条比对，多一个词就红框拦下。
        </p>

        <div className="mt-6 space-y-5">
          {tailor.bullets.slice(0, 3).map((b, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs text-neutral-400">原文</p>
              <p className="mt-1 text-sm text-neutral-500 line-through decoration-neutral-300">{b.original}</p>
              <p className="mt-2 text-xs text-neutral-400">改写</p>
              <p className="mt-1 text-sm font-medium">{b.rewritten}</p>
              <p className="mt-1 text-xs text-neutral-500">为什么：{b.reason}</p>
            </div>
          ))}
        </div>
        </section>
      )}

      {/* 面试 */}
      {(!only || only === "prep") && (
        <section id="prep" className="scroll-mt-8 py-10">
        <Kicker>03 · 面试准备</Kicker>
        <p className="mt-3 text-base font-medium">{prep.pitch}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {prep.numbers.map((n) => (
            <span
              key={n.value}
              className="inline-flex items-baseline gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs"
            >
              <strong className="text-sm tabular-nums">{n.value}</strong>
              {n.context}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {prep.questions.slice(0, 3).map((q) => (
            <div key={q.q} className="border-l-2 border-neutral-200 pl-4">
              <p className="text-sm font-medium">{q.q}</p>
              <p className="mt-1 text-xs text-neutral-500">对应事实：{q.evidence}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-neutral-200 p-4">
          <p className="text-xs text-neutral-400">追问链</p>
          <p className="mt-1 text-sm font-medium">{prep.deepDives[0]?.topic}</p>
          <ol className="mt-2 space-y-1">
            {prep.deepDives[0]?.levels.map((l, i) => (
              <li key={i} className="text-xs leading-relaxed text-neutral-600">
                {i + 1}. {l}
              </li>
            ))}
          </ol>
        </div>
        </section>
      )}

      {!only && (
        <>
          <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-8">
            <Link href="/app" className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white">
              用我自己的 JD 试
            </Link>
            <a
              href="https://github.com/EMOGYifanWang/offeralb"
              className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700"
            >
              GitHub
            </a>
          </div>
          <p className="mt-4 text-xs text-neutral-400">
            示例数据为虚构人物，JD 为自写。线上版不配置模型 key，模型相关能力需要自己部署后填 key。
          </p>
        </>
      )}
    </main>
  );
}
