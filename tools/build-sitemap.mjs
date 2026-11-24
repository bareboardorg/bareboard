#!/usr/bin/env node
/* Rebuild sitemap.xml and refresh feed.xml (the "What's New" feed).
   Dependency-free. Usage: node tools/build-sitemap.mjs [--check]
   With --check, the tool only reports what would change.

   Sitemap rules:
   - Every *.html in the tree is listed, except tarpit/ (a scraper trap,
     never advertised) and 404.html (the error page itself).
   - An index.html stands for its directory URL; the root index is /.
   - The canonical host is https://www.bareboard.org, matching each
     page's og:url. Older sitemaps mixed hosts; this tool normalizes.
   - lastmod comes from the file's modification date (YYYY-MM-DD).
   - changefreq/priority carry over from the previous sitemap for URLs
     already listed (matched by path). New URLs get defaults by kind:
     home daily/1.0, hub indexes and top-level pages weekly/0.8,
     nested pages monthly/0.6, library mirrors monthly/0.3.
   - Home first, then sorted URLs, so an unchanged tree reproduces the
     file byte for byte.

   Feed rules:
   - Items already in feed.xml are kept as they are.
   - FEED_PAGES lists editorial additions; each item's title and
     description are read from that page's own <title> and meta
     description, so the feed never promises words the page lacks.
   - Newest first, capped at 25 items; lastBuildDate is the newest
     item's date. Re-running changes nothing. */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeEntities } from "./html-entities.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://www.bareboard.org";
const checkOnly = process.argv.includes("--check");

/* Editorial feed additions: [page path, RFC-822 pubDate]. The list need
   not be in date order — output is sorted by date. Add pages here when
   they ship; never remove old entries (the merge keeps feed history). */
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

/* ----- sitemap ----- */

function collectHtml(dir, found) {
  const entries = readdirSync(dir).sort();
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectHtml(full, found);
    else if (name.endsWith(".html")) found.push(full);
  }
  return found;
}

function pageUrl(relPath) {
  if (relPath === "index.html") return HOST + "/";
  if (relPath.endsWith("/index.html")) {
    return HOST + "/" + relPath.slice(0, -"index.html".length);
  }
  return HOST + "/" + relPath;
}

function freshDefaults(relPath) {
  if (relPath === "index.html") return { changefreq: "daily", priority: "1.0" };
  if (relPath.startsWith("library/")) return { changefreq: "monthly", priority: "0.3" };
  if (relPath.endsWith("/index.html") || !relPath.includes("/")) {
    return { changefreq: "weekly", priority: "0.8" };
  }
  return { changefreq: "monthly", priority: "0.6" };
}

const sitemapFile = join(root, "sitemap.xml");
const carried = new Map(); // path -> {changefreq, priority}
if (existsSync(sitemapFile)) {
  const previous = readFileSync(sitemapFile, "utf8");
  const entryPattern = /<url>\s*<loc>https?:\/\/(?:www\.)?bareboard\.org(\/[^<]*)<\/loc>(?:\s*<lastmod>[^<]*<\/lastmod>)?\s*<changefreq>([^<]*)<\/changefreq>\s*<priority>([^<]*)<\/priority>\s*<\/url>/g;
  for (const match of previous.matchAll(entryPattern)) {
    carried.set(match[1], { changefreq: match[2], priority: match[3] });
  }
}

const pages = collectHtml(root, [])
  .map((full) => relative(root, full).split(sep).join("/"))
  .filter((relPath) => !relPath.startsWith("tarpit/") && relPath !== "404.html");

const entries = pages.map((relPath) => {
  const loc = pageUrl(relPath);
  const path = loc.slice(HOST.length);
  const kept = carried.get(path) || freshDefaults(relPath);
  const lastmod = statSync(join(root, relPath)).mtime.toISOString().slice(0, 10);
  return { loc, lastmod, changefreq: kept.changefreq, priority: kept.priority };
});
entries.sort((a, b) => {
  if (a.loc === HOST + "/") return -1;
  if (b.loc === HOST + "/") return 1;
  return a.loc < b.loc ? -1 : 1;
});

function sitemapEntry(entry) {
  return "  <url>\n" +
    "    <loc>" + entry.loc + "</loc>\n" +
    "    <lastmod>" + entry.lastmod + "</lastmod>\n" +
    "    <changefreq>" + entry.changefreq + "</changefreq>\n" +
    "    <priority>" + entry.priority + "</priority>\n" +
    "  </url>";
}

// The sitemaps.org namespace is the sitemap format's required identifier —
// an external interface name that must stay exactly as-is.
const sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.map(sitemapEntry).join("\n") + "\n</urlset>\n";

/* ----- feed ----- */

function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readPageMeta(relPath) {
  const html = readFileSync(join(root, relPath), "utf8");
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)">/);
  const rawTitle = titleMatch ? titleMatch[1] : relPath;
  const rawDesc = descMatch ? descMatch[1] : "";
  /* Drop the trailing " — BareBoard" site suffix from the title. */
  const title = decodeEntities(rawTitle)
    .replace(/\s+[—-]\s+(PMD\s+)?[—-]\s+BareBoard$/, "")
    .replace(/\s+[—-]\s+BareBoard$/, "");
  return { title, description: decodeEntities(rawDesc) };
}

const feedFile = join(root, "feed.xml");
const feedByLink = new Map(); // link -> item
if (existsSync(feedFile)) {
  const previous = readFileSync(feedFile, "utf8");
  const itemPattern = /<item>\s*<title>([^<]*)<\/title>\s*<link>([^<]*)<\/link>\s*<guid>[^<]*<\/guid>\s*<description>([^<]*)<\/description>\s*<pubDate>([^<]*)<\/pubDate>\s*<\/item>/g;
  for (const match of previous.matchAll(itemPattern)) {
    feedByLink.set(match[2], {
      title: match[1], link: match[2], description: match[3], pubDate: match[4],
    });
  }
}
for (const [relPath, pubDate] of FEED_PAGES) {
  const link = pageUrl(relPath);
  if (feedByLink.has(link)) continue;
  const meta = readPageMeta(relPath);
  feedByLink.set(link, {
    title: escapeXml(meta.title), link,
    description: escapeXml(meta.description), pubDate,
  });
}
const feedList = [...feedByLink.values()]
  .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate))
  .slice(0, 25);
const newestDate = feedList.length ? feedList[0].pubDate : "Wed, 11 Nov 2026 00:00:00 +0000";

function feedEntry(item) {
  return "    <item>\n" +
    "      <title>" + item.title + "</title>\n" +
    "      <link>" + item.link + "</link>\n" +
    "      <guid>" + item.link + "</guid>\n" +
    "      <description>" + item.description + "</description>\n" +
    "      <pubDate>" + item.pubDate + "</pubDate>\n" +
    "    </item>";
}

// RSS 2.0 is the feed format's required identifier — an external
// interface name that must stay exactly as-is.
const feedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0">\n' +
  "  <channel>\n" +
  "    <title>BareBoard — What's New</title>\n" +
  "    <link>https://bareboard.org/</link>\n" +
  "    <description>Recent additions to BareBoard, the free hardware education resource.</description>\n" +
  "    <language>en-us</language>\n" +
  "    <lastBuildDate>" + newestDate + "</lastBuildDate>\n" +
  feedList.map(feedEntry).join("\n") + "\n" +
  "  </channel>\n" +
  "</rss>\n";

/* ----- write / report ----- */

function publish(label, path, next) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === next) {
    console.log(label + ": unchanged");
    return;
  }
  if (checkOnly) {
    console.log(label + ": WOULD CHANGE");
    return;
  }
  writeFileSync(path, next);
  console.log(label + ": written");
}

publish("sitemap.xml", sitemapFile, sitemapXml);
const mirrorCount = pages.filter((p) => p.startsWith("library/")).length;
console.log("  " + entries.length + " URLs (" + mirrorCount +
  " library mirrors, tarpit + 404 excluded)");
publish("feed.xml", feedFile, feedXml);
console.log("  " + feedList.length + " items, newest " + newestDate);
