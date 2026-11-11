"use client";

import Link from "next/link";
import { useState } from "react";
import type { Analysis, Term } from "@/lib/analyze";

const SAMPLE_JD = `岗位职责：
1. 负责智能硬件产品的功能测试、兼容性测试与回归测试；
2. 编写测试用例并执行，跟踪缺陷直至关闭；
3. 参与自动化测试脚本的编写与维护。
任职要求：
1. 本科及以上学历，2 年以上软件测试经验；
2. 熟悉测试用例设计方法，掌握缺陷管理流程；
3. 熟悉 Linux 常用命令，能使用 Python 编写简单脚本；
4. 有接口测试经验，了解 Postman、JMeter 者优先；
5. 具备良好的沟通能力与团队协作意识。`;

const SAMPLE_RESUME = `张伟，3 年软件测试经验，主要做智能硬件与 App 的功能测试。
负责 5 个版本的回归测试，累计执行用例 1800+，提交缺陷 200+。
使用 Python 编写过接口自动化脚本，熟悉 Linux 与抓包工具。
参与过性能测试，用 JMeter 做过并发压测。`;

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

export default function AnalyzePage() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
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

  const pct = result ? Math.round(result.coverage * 100) : 0;
  const missing = result ? result.mustTerms.filter((t) => !t.covered) : [];
  const covered = result ? result.mustTerms.filter((t) => t.covered) : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs font-medium tracking-[0.2em] text-neutral-500">
          OFFERLAB
        </Link>
        <span className="text-xs text-neutral-400">W1 · 关键词分析</span>
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">粘贴 JD，先看清缺口</h1>
      <p className="mt-2 text-sm text-neutral-500">
        左边贴岗位要求，右边贴你的简历。这一版只做确定性的关键词匹配，不调用模型。
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
            同义词与技能等级判断需要模型，按路线图在 W2 接入。
          </p>
        </section>
      )}
    </main>
  );
}
