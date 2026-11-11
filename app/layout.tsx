import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OfferLab · 给一个 JD，出一版能投的简历",
  description:
    "AI 求职工作台：JD 分析、简历定制、面试准备。所有生成只引用事实库，不编造。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
