import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本机上级目录里还有别的 package-lock.json，不锁死 root 会让构建追踪到错误的目录。
  outputFileTracingRoot: path.resolve("."),
};

export default nextConfig;
