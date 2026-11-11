"use client";

import Link from "next/link";
import { useState } from "react";
import type { Prep } from "@/lib/prep";
import { SAMPLE_JD, SAMPLE_RESUME } from "@/lib/samples";

const TYPE_ORDER: Prep["questions"][number]["type"][] = ["技术", "项目", "行为", "反问"];

export default function PrepPage() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [prep, setPrep] = useState<Prep | null>(null);
  const [fabricated, setFabricated] = useState<string[]>([]);
  const [meta, setMeta] = useState<{ model: string; promptVersion: string; durationMs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "生成失败");
      setPrep(data.prep as Prep);
      setFabricated(data.audit?.fabricated ?? []);
      setMeta(data.meta);
    } catch (e) {
      setPrep(null);
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/app" className="text-xs font-medium tracking-[0.2em] text-neutral-500">
          OFFERLAB
        </Link>
        <span className="text-xs text-neutral-400">W4 · 面试准备</span>
      </div>

      <div className="print:hidden">
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">题目从 JD 来，答案从事实来</h1>
        <p className="mt-2 text-sm text-neutral-500">
          简历里没证据的能力照样出题——面试官一定会问，藏着不如想好怎么说。
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-neutral-600" htmlFor="jd">
              目标岗位 JD
            </label>
            <textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="贴岗位职责与任职要求"
              className="mt-2 h-48 w-full resize-y rounded-lg border border-neutral-200 p-3 text-sm leading-relaxed outline-none focus:border-neutral-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600" htmlFor="resume">
              简历原文
            </label>
            <textarea
              id="resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="贴简历正文"
              className="mt-2 h-48 w-full resize-y rounded-lg border border-neutral-200 p-3 text-sm leading-relaxed outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={loading || !jd.trim() || !resume.trim()}
            className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {loading ? "生成中…" : "生成面试包"}
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
          {prep && (
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            >
              导出速记卡
            </button>
          )}
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>
      </div>

      {prep && (
        <section className="mt-10 space-y-8 print:hidden">
          <div className="rounded-xl border border-neutral-200 p-6">
            <p className="text-xs text-neutral-500">30 秒定位</p>
            <p className="mt-1 text-base font-medium text-neutral-900">{prep.pitch}</p>

            {prep.numbers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {prep.numbers.map((n) => (
                  <span
                    key={n.value}
                    className="inline-flex items-baseline gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700"
                  >
                    <strong className="text-sm tabular-nums">{n.value}</strong>
                    {n.context}
                  </span>
                ))}
              </div>
            )}

            {fabricated.length > 0 && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                准备包里出现了简历没有的数字：{fabricated.join("、")}。别背，背了就是给自己挖坑。
              </div>
            )}
          </div>

          {TYPE_ORDER.map((type) => {
            const list = prep.questions.filter((q) => q.type === type);
            if (!list.length) return null;
            return (
              <div key={type}>
                <h2 className="text-sm font-medium text-neutral-800">
                  {type}题（{list.length}）
                </h2>
                <div className="mt-3 divide-y divide-neutral-100">
                  {list.map((q) => (
                    <div key={q.q} className="py-3">
                      <p className="text-sm font-medium text-neutral-900">{q.q}</p>
                      <p className="mt-1 text-xs text-neutral-500">为什么问：{q.why}</p>
                      <p className="mt-1 text-xs text-neutral-500">对应事实：{q.evidence}</p>
                      <ul className="mt-2 space-y-1">
                        {q.outline.map((o) => (
                          <li key={o} className="text-xs leading-relaxed text-neutral-700">
                            · {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {prep.deepDives.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-neutral-800">简历追问链</h2>
              <div className="mt-3 space-y-3">
                {prep.deepDives.map((d) => (
                  <div key={d.topic} className="rounded-lg border border-neutral-200 p-4">
                    <p className="text-sm font-medium text-neutral-900">{d.topic}</p>
                    <ol className="mt-2 space-y-1">
                      {d.levels.map((l, i) => (
                        <li key={i} className="text-xs leading-relaxed text-neutral-600">
                          {i + 1}. {l}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prep.redlines.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-medium text-amber-900">红线</h2>
              <ul className="mt-2 space-y-1">
                {prep.redlines.map((r) => (
                  <li key={r} className="text-xs leading-relaxed text-amber-800">
                    · {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {meta && (
            <p className="text-[11px] text-neutral-400">
              {meta.model} · prompt {meta.promptVersion} · {(meta.durationMs / 1000).toFixed(1)}s · 数字已比对
            </p>
          )}
        </section>
      )}

      {prep && (
        <section className="hidden print:block">
          <div className="print:break-after-page">
            <h1 className="text-lg font-semibold">面试速记卡</h1>
            <p className="mt-1 text-sm">{prep.pitch}</p>
            {prep.numbers.length > 0 && (
              <p className="mt-2 text-xs text-neutral-700">
                数字口径：{prep.numbers.map((n) => `${n.value}（${n.context}）`).join("；")}
              </p>
            )}
            <h2 className="mt-4 text-sm font-semibold">必讲的三条</h2>
            <ol className="mt-1 space-y-1.5">
              {prep.deepDives.slice(0, 3).map((d) => (
                <li key={d.topic} className="text-xs leading-relaxed">
                  <strong>{d.topic}</strong>
                  <br />
                  {d.levels.join(" → ")}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="text-sm font-semibold">要反问的问题</h2>
            <ul className="mt-1 space-y-1">
              {prep.questions
                .filter((q) => q.type === "反问")
                .map((q) => (
                  <li key={q.q} className="text-xs leading-relaxed">
                    · {q.q}
                  </li>
                ))}
            </ul>
            {prep.redlines.length > 0 && (
              <>
                <h2 className="mt-4 text-sm font-semibold">红线</h2>
                <ul className="mt-1 space-y-1">
                  {prep.redlines.map((r) => (
                    <li key={r} className="text-xs leading-relaxed">
                      · {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
