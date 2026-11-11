"use client";

import Link from "next/link";
import { useState } from "react";
import type { Analysis, Term } from "@/lib/analyze";
import type { Insight } from "@/lib/insight";
import { SAMPLE_JD, SAMPLE_RESUME } from "@/lib/samples";

function Chip({ term, tone }: { term: Term; tone: "ok" | "miss" | "nice" }) {
  const styles = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
    miss: "border-rose-200 bg-rose-50 text-rose-800",
    nice: "border-neutral-200 bg-neutral-50 text-neutral-600",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${styles}`}>
      {term.term}
      {term.hits > 1 && <span className="text-[10px] opacity-60">×{term.hits}</span>}
    </span>
  );
}

function LevelBadge({ level }: { level: Insight["gaps"][number]["level"] }) {
  const map = {
    strong: { text: "有证据", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    weak: { text: "证据弱", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    none: { text: "没证据", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  }[level];

  return <span className={`rounded border px-1.5 py-0.5 text-[11px] ${map.cls}`}>{map.text}</span>;
}

export default function AnalyzePage() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [insight, setInsight] = useState<Insight | null>(null);
  const [insightMeta, setInsightMeta] = useState<{
    model: string;
    promptVersion: string;
    durationMs: number;
  } | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  function resetInsight() {
    setInsight(null);
    setInsightMeta(null);
    setInsightError("");
  }

  async function run() {
    setLoading(true);
    setError("");
    resetInsight();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "分析失败");
      setResult(data as Analysis);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  }

  async function runInsight() {
    setInsightLoading(true);
    setInsightError("");
    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "模型调用失败");
      setInsight(data.insight as Insight);
      setInsightMeta(data.meta);
    } catch (e) {
      setInsight(null);
      setInsightError(e instanceof Error ? e.message : "模型调用失败");
    } finally {
      setInsightLoading(false);
    }
  }

  const pct = result ? Math.round(result.coverage * 100) : 0;
  const missing = result ? result.mustTerms.filter((t) => !t.covered) : [];
  const covered = result ? result.mustTerms.filter((t) => t.covered) : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs font-medium tracking-[0.2em] text-neutral-500">
          OFFERLAB
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/app/tailor" className="text-xs text-neutral-500 transition hover:text-neutral-900">
            定制简历 →
          </Link>
          <Link href="/app/prep" className="text-xs text-neutral-500 transition hover:text-neutral-900">
            准备面试 →
          </Link>
          <Link href="/app/jobs" className="text-xs text-neutral-500 transition hover:text-neutral-900">
            投递看板 →
          </Link>
          <Link href="/app/eval" className="text-xs text-neutral-500 transition hover:text-neutral-900">
            评测 →
          </Link>
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">粘贴 JD，先看清缺口</h1>
      <p className="mt-2 text-sm text-neutral-500">
        左边贴岗位要求，右边贴你的简历。先跑关键词，再让模型判断证据强弱。
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-600" htmlFor="jd">
            JD 原文
          </label>
          <textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="把岗位职责与任职要求整段贴进来"
            className="mt-2 h-64 w-full resize-y rounded-lg border border-neutral-200 p-3 text-sm leading-relaxed outline-none focus:border-neutral-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-600" htmlFor="resume">
            简历文本
          </label>
          <textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="贴简历正文，或先留空看看缺口长什么样"
            className="mt-2 h-64 w-full resize-y rounded-lg border border-neutral-200 p-3 text-sm leading-relaxed outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={loading || !jd.trim()}
          className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {loading ? "分析中…" : "开始分析"}
        </button>
        <button
          onClick={() => {
            setJd(SAMPLE_JD);
            setResume(SAMPLE_RESUME);
            resetInsight();
          }}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-400"
        >
          填入示例
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      {result && (
        <section className="mt-10 rounded-xl border border-neutral-200 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-500">硬性要求覆盖</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">{pct}%</p>
            </div>
            <p className="text-sm text-neutral-500">
              命中 {result.coveredMust} / {result.totalMust} 项
            </p>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-neutral-900 transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-medium text-neutral-800">缺口（{missing.length}）</h2>
              <p className="mt-1 text-xs text-neutral-500">JD 要求了，但简历里没出现</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {missing.length ? (
                  missing.map((t) => <Chip key={t.term} term={t} tone="miss" />)
                ) : (
                  <span className="text-xs text-neutral-400">没有缺口</span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-neutral-800">已命中（{covered.length}）</h2>
              <p className="mt-1 text-xs text-neutral-500">简历里能找到对应证据</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {covered.length ? (
                  covered.map((t) => <Chip key={t.term} term={t} tone="ok" />)
                ) : (
                  <span className="text-xs text-neutral-400">还没有命中项</span>
                )}
              </div>
            </div>
          </div>

          {result.niceTerms.length > 0 && (
            <div className="mt-8 border-t border-neutral-100 pt-6">
              <h2 className="text-sm font-medium text-neutral-800">加分项</h2>
              <p className="mt-1 text-xs text-neutral-500">写了是优势，不写不致命</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.niceTerms.map((t) => (
                  <Chip key={t.term} term={t} tone={t.covered ? "ok" : "nice"} />
                ))}
              </div>
            </div>
          )}

          <p className="mt-8 border-t border-neutral-100 pt-4 text-xs leading-relaxed text-neutral-400">
            口径：只统计能写进 JD 硬性要求的词；「优先 / 加分」归入加分项。
            关键词是确定性规则，同义词与证据强弱交给模型。
          </p>
        </section>
      )}

      {result && (
        <section className="mt-6 rounded-xl border border-neutral-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-neutral-800">模型解读</h2>
              <p className="mt-1 text-xs text-neutral-500">
                判断每条要求有没有证据、强弱、以及怎么补。会把 JD 和简历发给你配置的模型服务。
              </p>
            </div>
            <button
              onClick={runInsight}
              disabled={insightLoading || !resume.trim()}
              className="rounded-lg border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
            >
              {insightLoading ? "解读中…" : insight ? "重新解读" : "让模型解读"}
            </button>
          </div>

          {!resume.trim() && (
            <p className="mt-4 text-xs text-neutral-400">先贴一段简历，模型才有东西可判。</p>
          )}

          {insightError && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {insightError}
            </div>
          )}

          {insight && (
            <div className="mt-6 space-y-6">
              <p className="text-base font-medium text-neutral-900">{insight.verdict}</p>

              {insight.strengths.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500">站得住的优势</h3>
                  <ul className="mt-2 space-y-2">
                    {insight.strengths.map((s) => (
                      <li key={s.point} className="text-sm">
                        <span className="text-neutral-900">{s.point}</span>
                        <span className="ml-2 text-xs text-neutral-500">— {s.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.gaps.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500">逐条判证</h3>
                  <div className="mt-2 divide-y divide-neutral-100">
                    {insight.gaps.map((g) => (
                      <div key={g.term} className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">{g.term}</span>
                          <LevelBadge level={g.level} />
                          <span className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-600">
                            {g.action}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-600">{g.reason}</p>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-500">建议：{g.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insight.semanticHits.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500">关键词没命中、但语义命中</h3>
                  <ul className="mt-2 space-y-1.5">
                    {insight.semanticHits.map((s) => (
                      <li key={s.requirement} className="text-sm text-neutral-700">
                        {s.requirement}
                        <span className="ml-2 text-xs text-neutral-500">← {s.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insightMeta && (
                <p className="border-t border-neutral-100 pt-3 text-[11px] text-neutral-400">
                  {insightMeta.model} · prompt {insightMeta.promptVersion} ·{" "}
                  {(insightMeta.durationMs / 1000).toFixed(1)}s · 只依据你贴的简历，不补事实
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
