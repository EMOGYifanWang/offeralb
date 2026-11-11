export type CollectedJob = {
  url: string;
  title: string;
  company: string;
  jd: string;
};

/** 书签脚本传过来的是 JSON → base64，这里容忍 URL-safe 变体和缺失的 padding。 */
export function decodeBase64(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const SITE_SUFFIX = /(boss直聘|拉勾|猎聘|智联招聘|前程无忧|58同城|脉脉|看准网)/i;

/** 「岗位 - 公司 - 地点 | BOSS直聘」这类标题，尽量拆出岗位和公司。 */
export function splitTitle(raw: string): { title: string; company: string } {
  const cleaned = raw.replace(SITE_SUFFIX, "").trim();
  const parts = cleaned
    .split(/\s*[-–—|｜·]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return { title: "", company: "" };
  if (parts.length === 1) return { title: parts[0], company: "" };

  return { title: parts[0], company: parts[1] };
}

/** 解析 `#import=...` 里的内容；格式不对就返回 null，不抛错。 */
export function parseImport(hash: string): CollectedJob | null {
  const match = hash.match(/import=([^&]+)/);
  if (!match) return null;

  // 手工拼的链接可能是坏编码，decodeURIComponent 会直接抛 URIError。
  let param: string;
  try {
    param = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  const raw = decodeBase64(param);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as { u?: string; t?: string; x?: string };
    const { title, company } = splitTitle(payload.t ?? "");
    const jd = (payload.x ?? "").trim();
    if (!title && !jd) return null;
    return { url: payload.u ?? "", title, company, jd };
  } catch {
    return null;
  }
}

/**
 * 浏览器侧的检索：把查询拆成词，看命中几个。
 * 中文靠 Intl.Segmenter 切，英文按空格。没有索引，但几百条内够快。
 */
export function scoreMatch(query: string, fields: string[]): number {
  const trimmed = query.trim();
  if (!trimmed) return 1;

  const tokens = new Set<string>();
  const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
  for (const part of segmenter.segment(trimmed.toLowerCase())) {
    if (!part.isWordLike) continue;
    const word = part.segment.trim();
    // 单字（「测」「试」）命中率太高，只会制造假阳性。
    if (word.length >= 2) tokens.add(word);
  }
  if (tokens.size === 0) return 0;

  const haystack = fields.join(" ").toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) hits += 1;
  }
  return hits;
}

/** 书签脚本本体：在任意招聘页执行，把标题 + 正文 + 链接带回应用。 */
export function buildBookmarklet(origin: string): string {
  const code = `(()=>{try{
var pick=function(s){var e=document.querySelector(s);return e?e.innerText:''};
var body=pick('.job-sec-text')||pick('[class*=job-detail]')||pick('[class*=job-desc]')||pick('article')||document.body.innerText;
var t=document.title||'';var x=(body||'').replace(/\\n{3,}/g,'\\n\\n').slice(0,6000);
var p={u:location.href,t:t,x:x};
var b=btoa(unescape(encodeURIComponent(JSON.stringify(p))));
window.open('${origin}/app/jobs#import='+encodeURIComponent(b),'_blank');
}catch(e){alert('采集失败：'+e.message)}})()`;
  return `javascript:${code}`;
}
