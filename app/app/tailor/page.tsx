"use client";

import Link from "next/link";
import { useState } from "react";
import type { Tailor } from "@/lib/tailor";
import { SAMPLE_JD, SAMPLE_RESUME } from "@/lib/samples";

export default function TailorPage() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [fabricated, setFabricated] = useState<string[]>([]);
  const [fabricatedSkills, setFabricatedSkills] = useState<string[]>([]);
  const [meta, setMeta] = useState<{ model: string; promptVersion: string; durationMs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "生成失败");
      setTailor(data.tailor as Tailor);
      setFabricated(data.audit?.fabricated ?? []);
      setFabricatedSkills(data.audit?.fabricatedSkills ?? []);
      setMeta(data.meta);
    } catch (e) {
      setTailor(null);
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
        <span className="text-xs text-neutral-400">W3 · 简历定制</span>
      </div>

      <div className="print:hidden">
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">按岗位重写，不动一个数字</h1>
        <p className="mt-2 text-sm text-neutral-500">
          模型只能改写措辞和顺序，不能新增经历。改写里出现的每个数字，都会和原文逐个比对。
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
              className="mt-2 h-56 w-full resize-y rounded-lg border border-neutral-200 p-3 text-sm leading-relaxed outline-none focus:border-neutral-400"
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
              className="mt-2 h-56 w-full resize-y rounded-lg border border-neutral-200 p-3 text-sm leading-relaxed outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={loading || !jd.trim() || !resume.trim()}
            className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {loading ? "改写中…" : "生成定制简历"}
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
          {tailor && (
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            >
              导出 PDF
            </button>
          )}
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>
      </div>

      {tailor && (
        <section className="mt-10 rounded-xl border border-neutral-200 p-6 print:hidden">
          <p className="text-xs text-neutral-500">定位</p>
          <p className="mt-1 text-base font-medium text-neutral-900">{tailor.headline}</p>

          {fabricated.length > 0 && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              改写里出现了原文没有的数字：{fabricated.join("、")}。已拦截，这条不要直接用。
            </div>
          )}

          {fabricatedSkills.length > 0 && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              改写里出现了简历没写过的能力：{fabricatedSkills.join("、")}。模型在替你许诺没做过的事，删掉再用。
            </div>
          )}

          {tailor.warnings.length > 0 && (
            <ul className="mt-4 space-y-1">
              {tailor.warnings.map((w) => (
                <li key={w} className="text-xs text-amber-700">
                  风险：{w}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 space-y-5">
            {tailor.bullets.map((b, i) => (
              <div key={i} className="border-t border-neutral-100 pt-4 first:border-0 first:pt-0">
                <p className="text-xs text-neutral-400">原文</p>
                <p className="mt-1 text-sm text-neutral-500 line-through decoration-neutral-300">{b.original}</p>
                <p className="mt-2 text-xs text-neutral-400">改写</p>
                <p className="mt-1 text-sm font-medium text-neutral-900">{b.rewritten}</p>
                <p className="mt-1 text-xs text-neutral-500">为什么：{b.reason}</p>
              </div>
            ))}
          </div>

          {meta && (
            <p className="mt-6 border-t border-neutral-100 pt-3 text-[11px] text-neutral-400">
              {meta.model} · prompt {meta.promptVersion} · {(meta.durationMs / 1000).toFixed(1)}s · 数字已逐条比对
            </p>
          )}
        </section>
      )}

      {tailor && (
        <section className="mx-auto mt-10 hidden max-w-2xl print:mt-0 print:block">
          <h1 className="text-xl font-semibold">{tailor.headline}</h1>
          <ul className="mt-4 space-y-2">
            {tailor.bullets.map((b, i) => (
              <li key={i} className="text-sm leading-relaxed">
                • {b.rewritten}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
