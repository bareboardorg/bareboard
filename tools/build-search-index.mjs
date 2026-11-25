#!/usr/bin/env node
/* Build search-index.json, the static index search.js searches in the
   browser. No dependencies. Run it as:
     node tools/build-search-index.mjs [--check]
   Given --check it only reports what would change, and writes nothing.

   Index rules:
   - Every *.html in the tree is indexed, except tarpit/ (a scraper trap,
     never advertised) and 404.html (the error page itself). Library
     mirrors are indexed: their recall text is content worth finding.
   - An index.html stands for its directory URL; the root index is /.
   - Each entry: {url, title, headings, text}. title is the page's own
     <title>; headings are the h1-h3 headings inside <main>, in order,
     de-duplicated; text is the visible text of <main> with scripts,
     styles and the footer stripped, entities decoded, whitespace
     collapsed, capped at TEXT_CAP characters. The cap keeps the index
     fetchable: the exploded-view pages run to ~200k characters of
     table text each, and search is for finding pages, not part numbers
     buried in the middle of one.
   - Home first, then sorted URLs, so an unchanged tree reproduces the
     file byte for byte. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeEntities } from "./html-entities.mjs";
import { collectHtml } from "./site-files.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const TEXT_CAP = 10000;

function pageUrl(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) {
    return "/" + relPath.slice(0, -"index.html".length);
  }
  return "/" + relPath;
}

function plainText(fragment) {
  return decodeEntities(fragment.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}

function readEntry(relPath) {
  const html = readFileSync(join(root, relPath), "utf8");
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? plainText(titleMatch[1]) : relPath;
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let region = mainMatch ? mainMatch[1] : (bodyMatch ? bodyMatch[1] : html);
  /* The footer repeats on every page; keeping it would make footer words
     match every entry. The header is outside <main> already. */
  region = region.replace(/<footer[\s\S]*?<\/footer>/g, " ");
  const headings = [];
  const seen = new Set();
  for (const match of region.matchAll(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/g)) {
    const heading = plainText(match[1]);
    if (heading && !seen.has(heading)) {
      seen.add(heading);
      headings.push(heading);
    }
  }
  let text = region
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, " ");
  text = plainText(text).slice(0, TEXT_CAP);
  return { url: pageUrl(relPath), title, headings, text };
}

const pages = collectHtml(root, [])
  .map((full) => relative(root, full).split(sep).join("/"))
  .filter((relPath) => !relPath.startsWith("tarpit/") && relPath !== "404.html");

const entries = pages.map(readEntry);
entries.sort((a, b) => {
  if (a.url === "/") return -1;
  if (b.url === "/") return 1;
  return a.url < b.url ? -1 : 1;
});

const problems = [];
for (const entry of entries) {
  if (!entry.title) problems.push(entry.url + ": no title");
  if (!entry.text && !entry.headings.length) {
    problems.push(entry.url + ": no searchable text");
  }
}
if (problems.length) {
  console.log("INVALID search index:");
  for (const problem of problems) console.log(" - " + problem);
  process.exit(1);
}

const next = JSON.stringify(entries, null, 2) + "\n";
const indexFile = join(root, "search-index.json");
const current = existsSync(indexFile) ? readFileSync(indexFile, "utf8") : null;
if (current === next) {
  console.log("search-index.json: unchanged");
} else if (checkOnly) {
  console.log("search-index.json: WOULD CHANGE");
} else {
  writeFileSync(indexFile, next);
  console.log("search-index.json: written");
}
const mirrorCount = pages.filter((p) => p.startsWith("library/")).length;
const pmdCount = pages.filter((p) => p.startsWith("pmd")).length;
console.log("  " + entries.length + " entries (" + pmdCount + " PMD, " +
  mirrorCount + " library mirrors, tarpit + 404 excluded), " +
  Buffer.byteLength(next) + " bytes");
