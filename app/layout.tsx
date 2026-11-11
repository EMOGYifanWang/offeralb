import type { Metadata } from "next";
import "./globals.css";

const TITLE = "OfferLab · 给一个 JD，出一版能投的简历";
const DESCRIPTION =
  "开源求职工作台：竞争力分析、简历定制、面试准备、投递看板。生成只引用你的事实库，多一个数字、多一个技能都会被代码拦下。";

export const metadata: Metadata = {
  metadataBase: new URL("https://offeralb.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "OfferLab",
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "OfferLab — 给一个 JD，出一版能投的简历" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
