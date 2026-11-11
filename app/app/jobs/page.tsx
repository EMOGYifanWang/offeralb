"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildBookmarklet, parseImport, scoreMatch } from "@/lib/collect";

type Status = "待投" | "已投" | "已读" | "邀约" | "一面" | "二面" | "Offer" | "拒信";

type Application = {
  id: string;
  company: string;
  title: string;
  channel: string;
  status: Status;
  appliedAt: string;
  nextAt: string;
  note: string;
  jd?: string;
  url?: string;
};

const STATUSES: Status[] = ["待投", "已投", "已读", "邀约", "一面", "二面", "Offer", "拒信"];
const CHANNELS = ["Boss直聘", "猎聘", "智联", "前程无忧", "内推", "官网", "采集", "其他"];
const STORAGE_KEY = "offeralb.applications.v1";

const SEED: Application[] = [
  {
    id: "demo-1",
    company: "示例公司 A",
    title: "测试工程师",
    channel: "Boss直聘",
    status: "一面",
    appliedAt: "2026-11-02",
    nextAt: "2026-11-18",
    note: "示例数据，可直接删除",
  },
  {
    id: "demo-2",
    company: "示例公司 B",
    title: "软件验证工程师",
    channel: "内推",
    status: "已投",
    appliedAt: "2026-11-08",
    nextAt: "2026-11-15",
    note: "",
  },
  {
    id: "demo-3",
    company: "示例公司 C",
    title: "自动化测试",
    channel: "官网",
    status: "拒信",
    appliedAt: "2026-10-26",
    nextAt: "",
    note: "岗位取消",
  },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(item: Application): boolean {
  if (!item.nextAt) return false;
  if (item.status === "Offer" || item.status === "拒信") return false;
  return item.nextAt < today();
}

export default function JobsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Status | "全部">("全部");
  const [query, setQuery] = useState("");
  const [bookmarklet, setBookmarklet] = useState("");
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState("");

  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [status, setStatus] = useState<Status>("待投");
  const [appliedAt, setAppliedAt] = useState(today());
  const [nextAt, setNextAt] = useState("");

  useEffect(() => {
    setBookmarklet(buildBookmarklet(window.location.origin));

    let base: Application[] = SEED;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) base = JSON.parse(raw) as Application[];
    } catch {
      base = SEED;
    }

    const job = parseImport(window.location.hash);
    if (job) {
      base = [
        {
          id: `collected-${Date.now()}`,
          company: job.company || "待补充公司",
          title: job.title || "待补充岗位",
          channel: "采集",
          status: "待投",
          appliedAt: today(),
          nextAt: "",
          note: "",
          jd: job.jd,
          url: job.url,
        },
        ...base,
      ];
      window.history.replaceState(null, "", window.location.pathname);
      setImported(job.title || "已采集");
    }

    setItems(base);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function add() {
    if (!company.trim() || !title.trim()) return;
    setItems((prev) => [
      {
        id: `${Date.now()}`,
        company: company.trim(),
        title: title.trim(),
        channel,
        status,
        appliedAt,
        nextAt,
        note: "",
      },
      ...prev,
    ]);
    setCompany("");
    setTitle("");
    setNextAt("");
  }

  function update(id: string, patch: Partial<Application>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function copyBookmarklet() {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const stats = useMemo(() => {
    const active = items.filter((i) => !["Offer", "拒信"].includes(i.status)).length;
    const interviewing = items.filter((i) => ["邀约", "一面", "二面"].includes(i.status)).length;
    const overdue = items.filter(isOverdue).length;
    const collected = items.filter((i) => i.jd).length;
    return { total: items.length, active, interviewing, overdue, collected };
  }, [items]);

  const visible = useMemo(() => {
    const byStatus = filter === "全部" ? items : items.filter((i) => i.status === filter);
    if (!query.trim()) return byStatus;
    return byStatus
      .map((item) => ({ item, score: scoreMatch(query, [item.company, item.title, item.jd ?? "", item.note]) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.item);
  }, [items, filter, query]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/app" className="text-xs font-medium tracking-[0.2em] text-neutral-500">
          OFFERLAB
        </Link>
        <span className="text-xs text-neutral-400">投递看板 · 仅存本机浏览器</span>
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:mt-8">投了哪些，下一步做什么</h1>
      <p className="mt-2 text-sm text-neutral-500">
        记录和采集的 JD 都存在 localStorage，不上传服务器。换浏览器或清缓存会丢。
      </p>

      {imported && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          已采集：{imported}，可以点「去分析」直接看匹配度。
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "总数", value: stats.total },
          { label: "进行中", value: stats.active },
          { label: "面试阶段", value: stats.interviewing },
          { label: "待跟进", value: stats.overdue, warn: stats.overdue > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.warn ? "text-rose-600" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <details className="mt-6 rounded-xl border border-neutral-200 p-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-neutral-800">
          一键采集 JD
          <span className="ml-2 text-xs font-normal text-neutral-400">
            已采集 {stats.collected} 条 · 点开看怎么装
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-neutral-600">
          <p>
            把下面的按钮拖到浏览器书签栏（或复制内容，新建一个书签，地址粘贴进去）。看到中意的岗位时点一下，
            它会把标题、正文和链接带回这里，自动存成「待投」。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={bookmarklet}
              draggable
              onClick={(e) => e.preventDefault()}
              className="inline-block cursor-grab rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-medium text-white"
            >
              拖我到书签栏
            </a>
            <button
              onClick={copyBookmarklet}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-xs text-neutral-700 transition hover:border-neutral-400"
            >
              {copied ? "已复制" : "复制采集器代码"}
            </button>
          </div>
          <p className="text-neutral-400">
            只在你自己点开的那一页抓当前这一条，不遍历列表、不复用登录态、不绕验证码。抓不到正文时会提示，不会静默失败。
          </p>
        </div>
      </details>

      <div className="mt-6 rounded-xl border border-neutral-200 p-4">
        <div className="grid gap-2 sm:grid-cols-12">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="公司"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 sm:col-span-3"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="岗位"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 sm:col-span-3"
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 sm:col-span-2"
          >
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 sm:col-span-2"
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={!company.trim() || !title.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:bg-neutral-300 sm:col-span-2"
          >
            添加
          </button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-12">
          <label className="flex items-center gap-2 text-xs text-neutral-500 sm:col-span-4">
            投递日期
            <input
              type="date"
              value={appliedAt}
              onChange={(e) => setAppliedAt(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-500 sm:col-span-4">
            下次跟进
            <input
              type="date"
              value={nextAt}
              onChange={(e) => setNextAt(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜公司、岗位或 JD 正文…"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 sm:w-72"
        />
        {query && <span className="text-xs text-neutral-500">命中 {visible.length} 条</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(["全部", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-md border px-2.5 py-1 text-xs transition ${
              filter === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {s}
            {s !== "全部" && ` ${items.filter((i) => i.status === s).length}`}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100">
        {visible.length === 0 && <p className="py-10 text-center text-sm text-neutral-400">没有匹配的记录</p>}
        {visible.map((item) => (
          <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-12 sm:items-center">
            <div className="sm:col-span-3">
              <p className="text-sm font-medium text-neutral-900">{item.company}</p>
              <p className="text-xs text-neutral-500">{item.title}</p>
            </div>
            <div className="text-xs text-neutral-500 sm:col-span-2">
              {item.channel}
              <br />
              {item.appliedAt}
            </div>
            <div className="sm:col-span-2">
              <select
                value={item.status}
                onChange={(e) => update(item.id, { status: e.target.value as Status })}
                className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs outline-none focus:border-neutral-400"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="date"
                value={item.nextAt}
                onChange={(e) => update(item.id, { nextAt: e.target.value })}
                className={`w-full rounded-lg border px-2 py-1.5 text-xs outline-none ${
                  isOverdue(item) ? "border-rose-300 text-rose-700" : "border-neutral-200 focus:border-neutral-400"
                }`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:col-span-3 sm:justify-end">
              {item.jd && (
                <a
                  href={`/app?jd=${encodeURIComponent(item.jd)}`}
                  className="text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
                >
                  去分析
                </a>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-500 hover:text-neutral-800"
                >
                  原链接
                </a>
              )}
              {isOverdue(item) && <span className="text-rose-600">该跟进了</span>}
              <button
                onClick={() => remove(item.id)}
                className="text-neutral-400 transition hover:text-rose-600"
              >
                删除
              </button>
            </div>
            {item.note && <p className="text-xs text-neutral-400 sm:col-span-12">{item.note}</p>}
          </div>
        ))}
      </div>
    </main>
  );
}
