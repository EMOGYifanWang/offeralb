"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
};

const STATUSES: Status[] = ["待投", "已投", "已读", "邀约", "一面", "二面", "Offer", "拒信"];
const CHANNELS = ["Boss直聘", "猎聘", "智联", "前程无忧", "内推", "官网", "其他"];
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

  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [status, setStatus] = useState<Status>("待投");
  const [appliedAt, setAppliedAt] = useState(today());
  const [nextAt, setNextAt] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(raw ? (JSON.parse(raw) as Application[]) : SEED);
    } catch {
      setItems(SEED);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function add() {
    if (!company.trim() || !title.trim()) return;
    const next: Application = {
      id: `${Date.now()}`,
      company: company.trim(),
      title: title.trim(),
      channel,
      status,
      appliedAt,
      nextAt,
      note: "",
    };
    setItems((prev) => [next, ...prev]);
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

  const stats = useMemo(() => {
    const active = items.filter((i) => !["Offer", "拒信"].includes(i.status)).length;
    const interviewing = items.filter((i) => ["邀约", "一面", "二面"].includes(i.status)).length;
    const offers = items.filter((i) => i.status === "Offer").length;
    const overdue = items.filter(isOverdue).length;
    return { total: items.length, active, interviewing, offers, overdue };
  }, [items]);

  const visible = filter === "全部" ? items : items.filter((i) => i.status === filter);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-xs font-medium tracking-[0.2em] text-neutral-500">
          OFFERLAB
        </Link>
        <span className="text-xs text-neutral-400">投递看板 · 仅存本机浏览器</span>
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:mt-8">投了哪些，下一步做什么</h1>
      <p className="mt-2 text-sm text-neutral-500">
        记录存在 localStorage，不上传服务器。换浏览器或清缓存会丢，重要数据自己导出。
      </p>

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

      <div className="mt-6 flex flex-wrap gap-1.5">
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
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">这一栏还是空的</p>
        )}
        {visible.map((item) => (
          <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-12 sm:items-center">
            <div className="sm:col-span-4">
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
            <div className="flex items-center justify-between sm:col-span-2 sm:justify-end sm:gap-3">
              {isOverdue(item) && <span className="text-[11px] text-rose-600">该跟进了</span>}
              <button
                onClick={() => remove(item.id)}
                className="text-xs text-neutral-400 transition hover:text-rose-600"
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
