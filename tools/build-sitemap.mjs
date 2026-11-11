#!/usr/bin/env node
/* Regenerate sitemap.xml (every authored page + the archived library
   mirrors) and refresh feed.xml (RSS "What's New").
   Dependency-free. Usage: node tools/build-sitemap.mjs [--check]
   --check reports what would change without writing.

   Sitemap rules:
   - Walk the site tree for *.html. EXCLUDED: tarpit/ (a scraper trap —
     never advertised) and 404.html (the error page itself).
   - index.html maps to its directory URL; the root index maps to /.
   - Canonical host is https://www.bareboard.org (matches every page's
     og:url). The pre-2026-11 sitemap mixed bare and www hosts; this tool
     normalizes to www.
   - lastmod is the file's local modification date (YYYY-MM-DD).
   - changefreq/priority are preserved from the previous sitemap for URLs
     already listed (matched by path); new URLs get class defaults:
     home daily/1.0, hub indexes + top-level pages weekly/0.8,
     nested pages monthly/0.6, library mirrors monthly/0.3.
   - Output order: home first, then URLs sorted — deterministic, so a
     re-run with unchanged inputs is byte-identical.

   Feed rules:
   - Existing items are preserved (parsed back from feed.xml).
   - FEED_PAGES below is the editorial list of additions: title and
     description are read mechanically from each page's <title> and meta
     description, so the feed can never promise text the page doesn't have.
   - Items sort newest first, capped at 25; lastBuildDate is the newest
     item's date. Re-running is idempotent. */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://www.bareboard.org";
const checkOnly = process.argv.includes("--check");

/* Editorial feed additions: [page path, RFC-822 pubDate]. Newest content
   first is NOT required — output is date-sorted. Add new pages here when
   they ship; do not remove old entries (the merge keeps feed history). */
const FEED_PAGES = [
  ["pmd-q6-edge-3.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["gpu-repair.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["pmd-exploded.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["pmd-batteries.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["pmd-control.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["library-hub.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["repair-rights.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["repair-demand-letter.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["playstation-access.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["nintendo-access.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["pmd-programmers.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["pmd-repairs.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["pmd-fault-codes-2.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
  ["staying-up.html", "Wed, 11 Nov 2026 00:00:00 +0000"],
];

/* ---------------- sitemap ---------------- */

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function urlFor(rel) {
  if (rel === "index.html") return HOST + "/";
  if (rel.endsWith("/index.html")) return HOST + "/" + rel.slice(0, -"index.html".length);
  return HOST + "/" + rel;
}

function defaultsFor(rel) {
  if (rel === "index.html") return ["daily", "1.0"];
  if (rel.startsWith("library/")) return ["monthly", "0.3"];
  if (rel.endsWith("/index.html")) return ["weekly", "0.8"];
  if (!rel.includes("/")) return ["weekly", "0.8"];
  return ["monthly", "0.6"];
}

const sitemapPath = join(root, "sitemap.xml");
const prev = new Map(); // path -> {changefreq, priority}
if (existsSync(sitemapPath)) {
  const old = readFileSync(sitemapPath, "utf8");
  for (const m of old.matchAll(/<url>\s*<loc>https?:\/\/(?:www\.)?bareboard\.org(\/[^<]*)<\/loc>(?:\s*<lastmod>[^<]*<\/lastmod>)?\s*<changefreq>([^<]*)<\/changefreq>\s*<priority>([^<]*)<\/priority>\s*<\/url>/g)) {
    prev.set(m[1], { changefreq: m[2], priority: m[3] });
  }
}

const files = walk(root)
  .map(p => relative(root, p).split(sep).join("/"))
  .filter(rel => !rel.startsWith("tarpit/") && rel !== "404.html");

const urls = files.map(rel => {
  const loc = urlFor(rel);
  const path = loc.slice(HOST.length);
  const kept = prev.get(path);
  const [cf, pr] = kept ? [kept.changefreq, kept.priority] : defaultsFor(rel);
  const lastmod = statSync(join(root, rel)).mtime.toISOString().slice(0, 10);
  return { loc, lastmod, changefreq: cf, priority: pr };
});
urls.sort((a, b) => (a.loc === HOST + "/" ? -1 : b.loc === HOST + "/" ? 1 : a.loc < b.loc ? -1 : 1));

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

/* ---------------- feed ---------------- */

function decodeEntities(s) {
  return s
    .replace(/&mdash;/g, "\u2014").replace(/&ndash;/g, "\u2013")
    .replace(/&rsquo;/g, "\u2019").replace(/&lsquo;/g, "\u2018")
    .replace(/&ldquo;/g, "\u201C").replace(/&rdquo;/g, "\u201D")
    .replace(/&times;/g, "\u00D7").replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}
function xmlEsc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function pageMeta(rel) {
  const html = readFileSync(join(root, rel), "utf8");
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || rel;
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || "";
  const cleanTitle = decodeEntities(title).replace(/\s+[—-]\s+(PMD\s+)?[—-]\s+BareBoard$/, "").replace(/\s+[—-]\s+BareBoard$/, "");
  return { title: cleanTitle, description: decodeEntities(desc) };
}

const feedPath = join(root, "feed.xml");
const items = new Map(); // link -> item
if (existsSync(feedPath)) {
  const old = readFileSync(feedPath, "utf8");
  for (const m of old.matchAll(/<item>\s*<title>([^<]*)<\/title>\s*<link>([^<]*)<\/link>\s*<guid>[^<]*<\/guid>\s*<description>([^<]*)<\/description>\s*<pubDate>([^<]*)<\/pubDate>\s*<\/item>/g)) {
    items.set(m[2], { title: m[1], link: m[2], description: m[3], pubDate: m[4], raw: true });
  }
}
for (const [rel, pubDate] of FEED_PAGES) {
  const link = urlFor(rel);
  if (items.has(link)) continue;
  const meta = pageMeta(rel);
  items.set(link, { title: xmlEsc(meta.title), link, description: xmlEsc(meta.description), pubDate, raw: false });
}
const feedItems = [...items.values()]
  .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate))
  .slice(0, 25);
const lastBuild = feedItems.length ? feedItems[0].pubDate : "Wed, 11 Nov 2026 00:00:00 +0000";

const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BareBoard — What's New</title>
    <link>https://bareboard.org/</link>
    <description>Recent additions to BareBoard, the free hardware education resource.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${feedItems.map(i => `    <item>
      <title>${i.title}</title>
      <link>${i.link}</link>
      <guid>${i.link}</guid>
      <description>${i.description}</description>
      <pubDate>${i.pubDate}</pubDate>
    </item>`).join("\n")}
  </channel>
</rss>
`;

/* ---------------- write / report ---------------- */

function report(name, path, next) {
  const cur = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (cur === next) { console.log(`${name}: unchanged`); return; }
  if (checkOnly) { console.log(`${name}: WOULD CHANGE`); return; }
  writeFileSync(path, next);
  console.log(`${name}: written`);
}
report("sitemap.xml", sitemapPath, sitemapXml);
console.log(`  ${urls.length} URLs (${files.filter(f => f.startsWith("library/")).length} library mirrors, tarpit + 404 excluded)`);
report("feed.xml", feedPath, feedXml);
console.log(`  ${feedItems.length} items, newest ${lastBuild}`);
