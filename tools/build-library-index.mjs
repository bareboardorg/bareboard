#!/usr/bin/env node
/* Build data/library-index.json — the unified index behind library-hub.html.
   Dependency-free. Usage: node tools/build-library-index.mjs [--check]
   --check builds and validates in memory only, without writing the JSON.

   Sources, merged in this order (later sources win on shared keys):
     1. Local library files on disk:
          library/collected-public-docs/**, library/original-docs/,
          library/trackers/, datasheets/
     2. The Datasheet Index tables in datasheets.html (mostly link-only).
     3. The Rare Manuals entries in rare-manuals.html (link-only).
     4. Collection manifests in ../bareboard-library-manifests/**.json
        (PMD / FCC / FDA / lawsuit crews drop these as collection lands;
         their metadata overrides filename inference and scanned rows).

   Output record: {title, maker, model, platform, category, doc_type,
                   url, source_url, bytes, link_only}
   category is one of: manual schematic documentation datasheet
                       lawsuit fda fcc other
   url is the local path (leading slash) or null; link-only records carry
   source_url instead. Deterministic: same inputs -> same documents array. */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "data", "library-index.json");
const manifestsDir = join(root, "..", "bareboard-library-manifests");
const checkOnly = process.argv.includes("--check");

const CATEGORIES = ["manual", "schematic", "documentation", "datasheet",
  "lawsuit", "fda", "fcc", "other"];
const CAT_RANK = Object.fromEntries(CATEGORIES.map((c, i) => [c, i]));

/* ---------- small helpers ---------- */

function decodeEntities(s) {
  const named = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    mdash: "\u2014", ndash: "\u2013", rsquo: "\u2019", lsquo: "\u2018",
    rdquo: "\u201d", ldquo: "\u201c", hellip: "\u2026", middot: "\u00b7",
    copy: "\u00a9", reg: "\u00ae", trade: "\u2122", deg: "\u00b0",
    times: "\u00d7", micro: "\u00b5", Omega: "\u03a9", omega: "\u03c9",
  };
  return String(s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in named ? named[n] : m));
}
function stripTags(s) {
  return decodeEntities(String(s).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
function humanizeFilename(name) {
  return name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}
function cmpStr(a, b) {
  const x = String(a == null ? "" : a).toLowerCase();
  const y = String(b == null ? "" : b).toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}

/* ---------- category / platform inference ---------- */

const CATEGORY_ALIASES = [
  ["manual", ["manual", "manuals", "user-manual", "service-manual", "owner-manual",
    "owners-manual", "instruction-manual", "handbook", "operator-manual"]],
  ["schematic", ["schematic", "schematics", "schema", "schemas", "boardview", "layout"]],
  ["documentation", ["documentation", "doc", "docs", "guide", "reference", "paper",
    "research", "brief", "report", "article", "notes", "whitepaper", "white-paper"]],
  ["datasheet", ["datasheet", "datasheets", "data-sheet", "spec", "specification", "specs"]],
  ["lawsuit", ["lawsuit", "lawsuits", "litigation", "court", "complaint", "legal", "case"]],
  ["fda", ["fda", "510k", "510(k)", "fda-filing", "fda-clearance", "premarket", "fda-record"]],
  ["fcc", ["fcc", "fcc-filing", "fcc-grant", "grant", "equipment-authorization", "fcc-record"]],
];
function normalizeCategory(v) {
  if (!v) return null;
  const s = String(v).toLowerCase().trim().replace(/[\s_]+/g, "-");
  if (CATEGORIES.includes(s)) return s;
  for (const [cat, aliases] of CATEGORY_ALIASES) if (aliases.includes(s)) return cat;
  for (const [cat, aliases] of CATEGORY_ALIASES)
    if (aliases.some(a => s.includes(a))) return cat;
  return "other";
}
function inferFromPath(relPath) {
  const tokens = relPath.toLowerCase().split(/[/\-_]+/);
  let category = null;
  if (tokens.some(t => t.startsWith("fcc"))) category = "fcc";
  else if (tokens.some(t => t.startsWith("fda"))) category = "fda";
  else if (tokens.some(t => t.includes("lawsuit") || t.includes("litigation"))) category = "lawsuit";
  else if (tokens.some(t => t.includes("schematic"))) category = "schematic";
  else if (tokens.some(t => t.includes("datasheet"))) category = "datasheet";
  else if (tokens.some(t => t.includes("manual"))) category = "manual";
  let platform = null;
  if (tokens.includes("pmd")) platform = "Power Mobility (PMD)";
  else if (category === "lawsuit") platform = "Legal";
  return { category, platform };
}

/* Curated metadata for the documents already in the library (titles and
   descriptions as published on library.html / datasheets.html). Manifest
   records override these when collection crews land richer data. */
const KNOWN = {
  "/library/collected-public-docs/mandt-blackhat2016-demystifying-sep.pdf": {
    title: "Demystifying the Secure Enclave Processor — Black Hat USA 2016 (Mandt et al.)",
    maker: "Apple", model: "Secure Enclave Processor (SEP)", platform: "Apple",
    category: "documentation", doc_type: "Conference paper (PDF)" },
  "/library/collected-public-docs/pangu-mosec2020-attack-secure-boot-of-sep.pdf": {
    title: "Attack Secure Boot of SEP — MOSEC 2020 (Team Pangu)",
    maker: "Apple", model: "Secure Enclave Processor (SEP)", platform: "Apple",
    category: "documentation", doc_type: "Conference paper (PDF)" },
  "/library/collected-public-docs/buhren-blackhat2020-amd-psp.pdf": {
    title: "All You Ever Wanted to Know About the AMD PSP — Black Hat USA 2020 (Buhren et al.)",
    maker: "AMD", model: "Platform Security Processor (PSP)", platform: "AMD",
    category: "documentation", doc_type: "Conference paper (PDF)" },
  "/library/collected-public-docs/skochinsky-recon2014-intel-me-secrets.pdf": {
    title: "Intel ME Secrets — REcon 2014 (Skochinsky)",
    maker: "Intel", model: "Management Engine (ME/CSME)", platform: "Intel",
    category: "documentation", doc_type: "Conference paper (PDF)" },
  "/library/collected-public-docs/kioxia-xg6-product-brief.pdf": {
    title: "XG6 Client NVMe SSD Product Brief",
    maker: "Kioxia", model: "XG6", platform: "Storage",
    category: "documentation", doc_type: "Product brief (PDF)" },
  "/library/collected-public-docs/skhynix-h9tq27adftmcur-emcp-spec.pdf": {
    title: "H9TQ27ADFTMCUR eMCP Specification",
    maker: "SK hynix", model: "H9TQ27ADFTMCUR", platform: "Storage",
    category: "datasheet", doc_type: "Specification (PDF)" },
  "/library/original-docs/apple-sep-public-reference.md": {
    title: "Apple Secure Enclave — Public Reference",
    maker: "Apple", model: "Secure Enclave Processor (SEP)", platform: "Apple",
    category: "documentation", doc_type: "Original reference (Markdown)" },
  "/library/original-docs/amd-psp-public-reference.md": {
    title: "AMD PSP — Public Reference",
    maker: "AMD", model: "Platform Security Processor (PSP)", platform: "AMD",
    category: "documentation", doc_type: "Original reference (Markdown)" },
  "/library/original-docs/intel-csme-public-reference.md": {
    title: "Intel ME/CSME — Public Reference",
    maker: "Intel", model: "Management Engine (ME/CSME)", platform: "Intel",
    category: "documentation", doc_type: "Original reference (Markdown)" },
  "/library/original-docs/apple-pmic-identification-guide.md": {
    title: "Apple PMIC Identification Guide",
    maker: "Apple", model: "PMIC (multiple)", platform: "Apple",
    category: "documentation", doc_type: "Original guide (Markdown)" },
  "/library/original-docs/bareboard-10-most-wanted-devices.md": {
    title: "The 10 Most Wanted Devices (full draft)",
    maker: "BareBoard", model: null, platform: "Most Wanted",
    category: "documentation", doc_type: "Original document (Markdown)" },
  "/library/original-docs/bareboard-watchmen-tool-audit.md": {
    title: "Watchmen Tool Audit Framework",
    maker: "BareBoard", model: null, platform: "Watchmen",
    category: "documentation", doc_type: "Original document (Markdown)" },
  "/library/original-docs/bareboard-registry-draft.md": {
    title: "Registry — Tiered Documentation Registry (draft)",
    maker: "BareBoard", model: null, platform: "Registry",
    category: "documentation", doc_type: "Original document (Markdown)" },
  "/library/original-docs/hot100-methodology-notes.md": {
    title: "Hot 100 Methodology Notes",
    maker: "BareBoard", model: null, platform: "Hot 100",
    category: "documentation", doc_type: "Original document (Markdown)" },
  "/library/trackers/most-wanted-tracker.csv": {
    title: "Most Wanted Tracker",
    maker: "BareBoard", model: null, platform: "Most Wanted",
    category: "other", doc_type: "Tracker (CSV)" },
  "/datasheets/NCP302150.pdf": {
    title: "NCP302150 Datasheet",
    maker: "onsemi", model: "NCP302150", platform: "Power",
    category: "datasheet", doc_type: "Datasheet (PDF)" },
  "/datasheets/W25Q16JW.pdf": {
    title: "W25Q16JW Datasheet",
    maker: "Winbond", model: "W25Q16JW", platform: "Memory",
    category: "datasheet", doc_type: "Datasheet (PDF)" },
};

const EXT_DOC_TYPE = {
  ".pdf": "PDF", ".md": "Markdown", ".csv": "CSV", ".html": "HTML",
  ".txt": "Text", ".zip": "Archive",
};

/* ---------- record store with dedupe/merge ---------- */

const records = new Map(); // key -> record
function keyOf(r) {
  if (r.url) return "u:" + r.url;
  if (r.source_url) return "s:" + r.source_url;
  return "t:" + [r.title, r.maker, r.model].map(v => String(v || "").toLowerCase()).join("|");
}
function addRecord(r, preferIncoming) {
  const base = {
    title: null, maker: null, model: null, platform: null,
    category: "other", doc_type: null, url: null, source_url: null,
    bytes: null,
  };
  const rec = { ...base, ...Object.fromEntries(
    Object.entries(r).filter(([, v]) => v !== undefined && v !== "")) };
  rec.category = normalizeCategory(rec.category) || "other";
  rec.link_only = !rec.url;
  const k = keyOf(rec);
  const existing = records.get(k);
  if (!existing) { records.set(k, rec); return; }
  // Merge: fill gaps; prefer the incoming record only when asked (manifests).
  for (const f of Object.keys(base)) {
    if (preferIncoming) {
      if (rec[f] !== null && rec[f] !== undefined) existing[f] = rec[f];
    } else if (existing[f] === null || existing[f] === undefined) {
      if (rec[f] !== null && rec[f] !== undefined) existing[f] = rec[f];
    }
  }
  existing.link_only = !existing.url;
}

/* ---------- source 1: local files ---------- */

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
let localCount = 0;
for (const baseDir of ["library/collected-public-docs", "library/original-docs",
                       "library/trackers", "datasheets"]) {
  for (const abs of walk(join(root, baseDir))) {
    const rel = relative(root, abs).split(sep).join("/");
    const url = "/" + rel;
    const ext = (rel.match(/\.[a-z0-9]+$/i) || [""])[0].toLowerCase();
    const inferred = inferFromPath(rel);
    const known = KNOWN[url] || {};
    addRecord({
      title: known.title || humanizeFilename(rel.split("/").pop()),
      maker: known.maker || null,
      model: known.model !== undefined ? known.model : null,
      platform: known.platform || inferred.platform,
      category: known.category || inferred.category ||
        (baseDir === "datasheets" ? "datasheet"
          : inferred.platform === "Power Mobility (PMD)" ? "manual"
          : "documentation"),
      doc_type: known.doc_type || EXT_DOC_TYPE[ext] || (ext ? ext.slice(1).toUpperCase() : null),
      url,
      source_url: null,
      bytes: statSync(abs).size,
    }, false);
    localCount++;
  }
}

/* ---------- source 2: datasheets.html tables ---------- */

const SECTION_PLATFORM = {
  "microcontrollers": "Microcontrollers",
  "single-board-computers-dev-boards-schematics": "Single-Board Computers",
  "common-ics": "Common ICs",
  "sensors": "Sensors",
  "power": "Power",
  "wireless": "Wireless",
  "memory": "Memory",
  "displays": "Displays",
  "motor-drivers": "Motor Drivers",
  "usb-serial": "USB & Serial",
  "gpus-ai-accelerators-what-s-actually-public": "GPU & AI Accelerators",
  "game-console-chips": "Game Consoles",
  "connectors-standards": "Connectors & Standards",
  "no-public-datasheet": "No Public Datasheet",
};
let dsParsed = 0, dsSkipped = 0;
{
  const html = readFileSync(join(root, "datasheets.html"), "utf8");
  const tokenRe = /<section id="([^"]+)"|<\/section>|<h2[^>]*>([\s\S]*?)<\/h2>|<table[^>]*class="[^"]*datasheet-table[^"]*"|<\/table>|<tr>([\s\S]*?)<\/tr>/g;
  const stack = []; // {id, heading}
  let inTable = false;
  let m;
  while ((m = tokenRe.exec(html)) !== null) {
    if (m[1] !== undefined) stack.push({ id: m[1], heading: null });
    else if (m[0] === "</section>") stack.pop();
    else if (m[2] !== undefined) {
      if (stack.length) stack[stack.length - 1].heading =
        stripTags(m[2]).replace(/\s*\(\d+\)\s*$/, "").trim();
    } else if (m[0].startsWith("<table")) inTable = true;
    else if (m[0] === "</table>") inTable = false;
    else if (m[3] !== undefined && inTable && stack.length) {
      const cells = [...m[3].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(c => c[1]);
      if (cells.length < 3) continue;
      const linkM = m[3].match(/<a href="([^"]+)"/);
      if (!linkM) { dsSkipped++; continue; }
      const href = decodeEntities(linkM[1]);
      const sec = stack[stack.length - 1];
      const isLocal = href.startsWith("/");
      addRecord({
        title: stripTags(cells[0]),
        maker: stripTags(cells[1]) || null,
        model: null,
        platform: SECTION_PLATFORM[sec.id] || sec.heading || null,
        category: sec.id.includes("schematic") ? "schematic" : "datasheet",
        doc_type: sec.heading || "Datasheet index",
        url: isLocal ? href : null,
        source_url: isLocal ? null : href,
        bytes: null,
      }, false);
      dsParsed++;
    }
  }
}

/* ---------- source 3: rare-manuals.html entries ---------- */

const RM_PLATFORM_RULES = [
  [/intellivision|mattel/i, "Intellivision"], [/osborne/i, "Osborne"],
  [/kaypro|non linear/i, "Kaypro"], [/apple|macintosh/i, "Apple"],
  [/\bibm\b|international business/i, "IBM PC"], [/commodore|amiga/i, "Commodore"],
  [/atari/i, "Atari"], [/nintendo/i, "Nintendo"], [/sega/i, "Sega"],
  [/sinclair/i, "Sinclair"], [/texas instruments|\bti\b/i, "Texas Instruments"],
  [/hewlett|hp /i, "HP"], [/sony/i, "Sony"], [/tandy|radio shack/i, "Tandy"],
  [/acorn/i, "Acorn"], [/next/i, "NeXT"], [/sun micro/i, "Sun"],
  [/\bdec\b|digital equipment/i, "DEC"], [/xerox/i, "Xerox"],
];
let rmParsed = 0;
{
  const html = readFileSync(join(root, "rare-manuals.html"), "utf8");
  const chunks = html.split('<article class="manual-entry"').slice(1);
  for (const chunk of chunks) {
    const body = chunk.split("</article>")[0];
    const h3 = body.match(/<h3>([\s\S]*?)<\/h3>/);
    if (!h3) continue;
    const title = stripTags(h3[1].replace(/<span class="rank">[\s\S]*?<\/span>/, "")
      .replace(/<span class="rarity[^"]*">[\s\S]*?<\/span>/, ""));
    if (!title) continue;
    const decade = (chunk.match(/data-decade="([^"]+)"/) || [])[1] || null;
    const rarityRaw = (chunk.match(/data-rarity="([^"]+)"/) || [])[1] || null;
    const rarity = { onlyknowncopy: "only known copy", fewmirrors: "few mirrors",
      severalmirrors: "several mirrors" }[rarityRaw] || rarityRaw;
    const makerM = body.match(/<strong>Manufacturer:<\/strong>(.*?)<\/p>/);
    let maker = makerM ? stripTags(makerM[1]) : null;
    let model = null;
    if (maker) {
      const pm = maker.match(/\(([^)]*)\)/);
      if (pm) { model = pm[1].replace(/^Model\s+/i, ""); maker = maker.replace(/\s*\([^)]*\)/, "").trim(); }
    }
    const srcM = body.match(/<a href="([^"]+)"[^>]*>\s*Public source\s*<\/a>/);
    const category = /schematics?\b/i.test(title) ? "schematic"
      : /datasheet|data sheet/i.test(title) ? "datasheet" : "manual";
    let platform = "Vintage & Retro";
    for (const [re, name] of RM_PLATFORM_RULES) {
      if (re.test((maker || "") + " " + title)) { platform = name; break; }
    }
    addRecord({
      title,
      maker,
      model,
      platform,
      category,
      doc_type: "Rare manual" + (decade ? " · " + decade : "") + (rarity ? " · " + rarity : ""),
      url: null,
      source_url: srcM ? decodeEntities(srcM[1]) : null,
      bytes: null,
    }, false);
    rmParsed++;
  }
}

/* ---------- source 4: collection manifests ---------- */

function pick(obj, names) {
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && obj[n] !== "") return obj[n];
  }
  return null;
}
/* The collection crews' manifests use their own field names: lawsuits carry
   case_name, FCC records carry product/grantee, FDA records carry device and
   k_number, and none of the three carries a category. Map those fields here
   so manifest metadata lands in the index instead of failing validation. */
function inferCategoryFromDocType(dt) {
  if (!dt) return null;
  const s = String(dt).toLowerCase();
  if (s.startsWith("fcc")) return "fcc";
  if (s.startsWith("fda")) return "fda";
  if (["opinion", "order", "legislation", "settlement", "testimony",
       "agency-action", "exemption-ruling", "complaint", "decision",
       "brief", "filing"].includes(s)) return "lawsuit";
  if (["parts", "technical", "owner", "fault-codes", "service",
       "programming", "user-manual", "service-manual"].includes(s)) return "manual";
  return null;
}
function manifestRecord(raw) {
  let url = pick(raw, ["url", "local_path", "path", "file", "href"]);
  let source_url = pick(raw, ["source_url", "source", "original_url", "external_url", "link"]);
  if (url && /^https?:\/\//i.test(url)) { if (!source_url) source_url = url; url = null; }
  if (url) {
    url = String(url);
    if (!url.startsWith("/")) {
      url = url.includes("/")
        ? "/" + url.replace(/^\.?\//, "")
        : "/library/collected-public-docs/" + url;
    }
    url = url.split("/").map(seg => seg === "" ? "" : seg).join("/").replace(/\/{2,}/g, "/");
  }
  if (source_url && !/^https?:\/\//i.test(source_url)) source_url = null;
  let bytes = pick(raw, ["bytes", "size", "file_size"]);
  bytes = typeof bytes === "number" ? bytes : null;
  if (url && bytes === null) {
    const abs = join(root, url.replace(/^\//, ""));
    if (existsSync(abs)) bytes = statSync(abs).size;
  }
  let title = pick(raw, ["title", "name", "document", "doc_title", "case_name", "product"]);
  if (!title && raw.device) {
    title = String(raw.device);
    const k = pick(raw, ["k_number", "k", "510k"]);
    if (k) title += " (" + k + ")";
  }
  const doc_type = pick(raw, ["doc_type", "format", "file_type"]);
  // normalizeCategory returns "other" for unknown values; treat that as no
  // signal so the doc_type inference below can classify the record.
  const pickedCat = pick(raw, ["category", "kind", "doc_category"]) || pick(raw, ["type"]);
  const normCat = pickedCat ? normalizeCategory(pickedCat) : null;
  const rawCategory = (normCat && normCat !== "other") ? normCat : null;
  return {
    title,
    maker: pick(raw, ["maker", "manufacturer", "vendor", "brand", "company", "grantee"]),
    model: pick(raw, ["model", "device", "product", "part", "part_number"]),
    platform: pick(raw, ["platform", "system", "family"]),
    category: rawCategory || inferCategoryFromDocType(doc_type),
    doc_type,
    url: url || null,
    source_url: source_url || null,
    bytes,
  };
}
let manifestFiles = 0, manifestRecords = 0;
if (existsSync(manifestsDir)) {
  for (const abs of walk(manifestsDir)) {
    if (!abs.endsWith(".json")) continue;
    manifestFiles++;
    let parsed;
    try { parsed = JSON.parse(readFileSync(abs, "utf8")); }
    catch (e) { console.error(`WARN: unparseable manifest ${abs}: ${e.message}`); continue; }
    let list = null;
    if (Array.isArray(parsed)) list = parsed;
    else if (parsed && typeof parsed === "object") {
      for (const k of ["documents", "records", "items", "docs", "entries"]) {
        if (Array.isArray(parsed[k])) { list = parsed[k]; break; }
      }
      if (!list) {
        const vals = Object.values(parsed).filter(v => v && typeof v === "object" && !Array.isArray(v));
        if (vals.length) list = vals;
      }
    }
    if (!list) { console.error(`WARN: no record list found in manifest ${abs}`); continue; }
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const rec = manifestRecord(raw);
      if (!rec.title && !rec.url && !rec.source_url) continue;
      if (!rec.title && rec.url) rec.title = humanizeFilename(rec.url.split("/").pop());
      addRecord(rec, true);
      manifestRecords++;
    }
  }
}

/* ---------- sort, validate, write ---------- */

const docs = [...records.values()].sort((a, b) =>
  (CAT_RANK[a.category] - CAT_RANK[b.category]) ||
  cmpStr(a.platform || "\uffff", b.platform || "\uffff") ||
  cmpStr(a.title, b.title) ||
  cmpStr(a.url || a.source_url, b.url || b.source_url));

const errors = [];
for (const d of docs) {
  if (!d.title) errors.push("record missing title: " + JSON.stringify(d).slice(0, 120));
  if (!CATEGORIES.includes(d.category)) errors.push(d.title + ": bad category " + d.category);
  if (d.url && !existsSync(join(root, d.url.replace(/^\//, ""))))
    errors.push(d.title + ": local url does not exist: " + d.url);
  if (!d.url && !d.source_url) errors.push(d.title + ": neither url nor source_url");
  if (d.link_only !== !d.url) errors.push(d.title + ": link_only flag inconsistent");
}
if (errors.length) {
  console.error("INVALID library index:");
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}

const counts = {};
for (const c of CATEGORIES) counts[c] = 0;
for (const d of docs) counts[d.category]++;

const out = {
  version: 1,
  generated: new Date().toISOString().slice(0, 10),
  total: docs.length,
  counts,
  documents: docs,
};
if (!checkOnly) writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

const local = docs.filter(d => d.url).length;
console.log(`OK: ${docs.length} documents (${local} local, ${docs.length - local} link-only)` +
  (checkOnly ? " (check only)" : `; wrote ${outPath}`));
console.log("by category: " + CATEGORIES.map(c => `${c}=${counts[c]}`).join(" "));
console.log(`sources: ${localCount} local files, ${dsParsed} datasheet rows ` +
  `(${dsSkipped} unlinked rows skipped), ${rmParsed} rare manuals, ` +
  `${manifestRecords} manifest records from ${manifestFiles} manifest file(s)`);
