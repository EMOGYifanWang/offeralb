import Image from "next/image";
import Link from "next/link";

const GATES = [
  {
    name: "数字闸",
    rule: "改写里出现的每个数字，必须能在简历原文里找到。",
    detail: "模型把 JD 的「2 年经验」搬进简历，被这道闸拦下来过。",
  },
  {
    name: "技能闸",
    rule: "改写里出现的技能，必须能在简历原文里找到同义词。",
    detail: "模型偷偷加了「多机型兼容性验证」，被这道闸拦下来过。",
  },
  {
    name: "人工闸",
    rule: "逐条对照原文，确认后才允许导出。",
    detail: "未确认的版本不提供导出按钮。",
  },
];

const FAQ = [
  {
    q: "数据从哪来？",
    a: "示例 JD 是自写的，示例人物是虚构的。没有使用真实招聘网站的岗位数据——Boss 直聘的 robots.txt 明确禁止查询类路径，也找不到同时满足「完整正文 + 明确许可 + 免登录」的中文公开数据集。",
  },
  {
    q: "会不会编造经历？",
    a: "会试图编，所以有两道代码闸。数字和技能逐条比对，多一个就红框拦下并禁止导出。但闸门只能证明「没放过」，不能证明「没编」——最终还得你自己逐条确认。",
  },
  {
    q: "要花钱吗？",
    a: "代码 MIT，随便用。模型调用要花自己的 token：一个岗位从分析到面试包大约 3–5 万 token，DeepSeek 上是几毛钱。",
  },
  {
    q: "能直接拿去做成商业产品吗？",
    a: "许可证允许。但模型输出的质量取决于你的事实库，出了事得自己担——这个项目没有做任何合规承诺。",
  },
];

function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mt-10 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <Image
        src={`${src}?v=2`}
        alt={alt}
        width={1280}
        height={800}
        priority
        className="h-auto w-full"
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#fbfbfa]">
      <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-[#fbfbfa]/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="text-xs font-medium tracking-[0.2em] text-neutral-800">OFFERLAB</span>
          <nav className="flex items-center gap-5 text-xs text-neutral-600">
            <a href="#analyze" className="transition hover:text-neutral-900">
              分析
            </a>
            <a href="#tailor" className="transition hover:text-neutral-900">
              定制
            </a>
            <a href="#prep" className="transition hover:text-neutral-900">
              面试
            </a>
            <Link href="/demo" className="rounded-md bg-neutral-900 px-3 py-1.5 text-white">
              看示例
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20">
        <p className="text-xs font-medium tracking-[0.2em] text-neutral-400">求职工作台 · 开源</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl">
          给一个 JD，
          <br />
          出一版能投的简历。
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600">
          以岗位为单位，把分析、定制、面试串成一条流水线。所有生成只引用你的事实库，
          多一个数字、多一个技能，都会被代码拦下来。
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/demo"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            看示例回放（不用登录）
          </Link>
          <a
            href="https://github.com/EMOGYifanWang/offeralb"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-500"
          >
            GitHub
          </a>
          <span className="text-xs text-neutral-400">MIT · 一条命令本地跑起来</span>
        </div>
      </section>

      <section id="analyze" className="scroll-mt-20 border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-medium tracking-[0.18em] text-neutral-400">01 · 竞争力分析</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">先看清缺什么，再决定投不投</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600">
            JD 进来，先跑一遍确定性的关键词匹配——这一层不调模型，结果可复现。
            再让模型逐条判断「有没有证据、证据强不强、该怎么补」。
          </p>
          <ul className="mt-5 max-w-2xl space-y-2 text-sm text-neutral-700">
            <li>· 硬性要求覆盖率，缺口按「今天能补 / 一周能补 / 补不了」分类</li>
            <li>· 每条判断都指回简历原文，没有证据就写「简历无证据」</li>
            <li>· 覆盖率的分子分母都是代码算的，模型只负责判断语义</li>
          </ul>
          <Shot src="/shots/analyze.png" alt="竞争力分析界面：67% 覆盖率、三项缺口、已命中关键词" />
        </div>
      </section>

      <section id="tailor" className="scroll-mt-20 border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-medium tracking-[0.18em] text-neutral-400">02 · 简历定制</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">改措辞，不改事实</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600">
            模型只做选材和改写：挑出最能支撑岗位的几条经历，把 JD 的关键词自然嵌进已有事实里。
            原文和改写逐条对照，改了什么、为什么改，都写在旁边。
          </p>
          <ul className="mt-5 max-w-2xl space-y-2 text-sm text-neutral-700">
            <li>· 每条改写挂原文，数字和技能逐条比对</li>
            <li>· 一页纸预算，超了就得删</li>
            <li>· 浏览器直接打印成 PDF，不依赖任何 PDF 库</li>
          </ul>
          <Shot src="/shots/tailor.png" alt="简历定制界面：原文与改写逐条对照" />
        </div>
      </section>

      <section id="prep" className="scroll-mt-20 border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-medium tracking-[0.18em] text-neutral-400">03 · 面试准备</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">题目从 JD 来，答案从事实来</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600">
            简历里没证据的能力，照样出题——面试官一定会问。区别是它会告诉你「这条你没有证据」，
            并给一个承认没做过、但说清楚怎么上手的说法。
          </p>
          <ul className="mt-5 max-w-2xl space-y-2 text-sm text-neutral-700">
            <li>· 技术、项目、行为、反问四类，每题带「为什么问」</li>
            <li>· 每条经历生成三层追问链，专治「然后呢」</li>
            <li>· 两页速记卡，进场前十分钟只看这一张</li>
          </ul>
          <Shot src="/shots/prep.png" alt="面试准备界面：数字口径、题目与三层追问链" />
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-medium tracking-[0.18em] text-neutral-400">04 · 事实锁</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight">
            让 AI 改简历最大的风险不是写得差，是写得像真的
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600">
            「熟练使用 Postman」写进简历只要一秒，面试官追问一句就露。这个项目的三道闸都在代码里，
            不靠模型自觉。
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {GATES.map((g) => (
              <div key={g.name} className="rounded-xl border border-neutral-200 p-5">
                <p className="text-sm font-medium text-neutral-900">{g.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{g.rule}</p>
                <p className="mt-3 text-xs leading-relaxed text-neutral-500">{g.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-neutral-400">开源 / 自部署</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">一条命令跑起来</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                不需要 Docker、数据库服务或任何外部账号。模型 key 只存在本地环境变量里，
                不会进仓库，也不会发到浏览器。
              </p>
              <pre className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-4 text-xs leading-relaxed text-neutral-700">
                <code>{`git clone https://github.com/EMOGYifanWang/offeralb
cd offeralb && npm install
cp .env.example .env.local   # 填 DEEPSEEK_API_KEY
npm run dev`}</code>
              </pre>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
              <p>
                <span className="font-medium text-neutral-900">技术栈：</span>
                Next.js 15 + TypeScript + Tailwind，模型走 OpenAI 兼容协议，默认 DeepSeek。
              </p>
              <p>
                <span className="font-medium text-neutral-900">评测：</span>
                关键词覆盖率、结构化输出合法率、单岗位耗时，由 <code className="text-xs">npm run eval</code>{" "}
                产出，页面上的数字必须能追到仓库里的文件。
              </p>
              <p>
                <span className="font-medium text-neutral-900">不做的事：</span>
                不自动投递、不爬招聘网站、不做账号体系。投递记录本身就是个表格，不值得为它写一个后台。
              </p>
              <a
                href="https://github.com/EMOGYifanWang/offeralb"
                className="inline-block rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-500"
              >
                看源码
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">常见问题</h2>
          <div className="mt-8 divide-y divide-neutral-200">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-neutral-900">
                  {item.q}
                  <span className="text-neutral-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-10 text-xs text-neutral-500">
          <span>OfferLab · MIT License · 示例数据为虚构</span>
          <div className="flex gap-5">
            <Link href="/demo" className="hover:text-neutral-800">
              示例回放
            </Link>
            <Link href="/app" className="hover:text-neutral-800">
              开始使用
            </Link>
            <a href="https://github.com/EMOGYifanWang/offeralb" className="hover:text-neutral-800">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
