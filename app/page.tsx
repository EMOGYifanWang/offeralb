import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-medium tracking-[0.2em] text-neutral-500">OFFERLAB</p>

      <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
        给一个 JD，
        <br />
        出一版能投的简历。
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600">
        以岗位为单位，把分析、定制、面试准备串成一条流水线。所有生成只引用你的事实库，
        不编造数字、不加没做过的工具。
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href="/app"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          试试关键词分析
        </Link>
        <a
          href="https://github.com/EMOGYifanWang/offeralb"
          className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          GitHub
        </a>
      </div>

      <p className="mt-16 text-xs leading-relaxed text-neutral-400">
        W1 · 当前只实现了确定性的关键词覆盖分析，不调用模型。
        语义判断、简历改写与面试题库按路线图接入。
      </p>
    </main>
  );
}
