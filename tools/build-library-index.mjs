#!/usr/bin/env node
/* Build data/library-index.json — the unified index behind library-hub.html.
   Dependency-free. Usage: node tools/build-library-index.mjs [--check]
   With --check the index is built and validated in memory only.

   Four sources feed the index, merged in order (later sources win when
   they speak about the same document):
     1. Library files on disk: library/collected-public-docs/**,
        library/original-docs/, library/trackers/, datasheets/.
     2. The Datasheet Index tables in datasheets.html (mostly link-only).
     3. The Rare Manuals entries in rare-manuals.html (link-only).
     4. Collection manifests in ../bareboard-library-manifests/**.json,
        dropped by the collection crews as material lands; their metadata
        overrides filename inference and scanned rows.

   Each output record carries {title, maker, model, platform, category,
   doc_type, url, source_url, bytes, link_only, basis}. basis is the
   rights-gate sentence for the record — why it may be published or
   linked. Manifests and the KNOWN table carry real basis sentences;
   anything else gets UNVERIFIED_BASIS. category is one of manual,
   schematic, documentation, datasheet, lawsuit, fda, fcc, other. url is
   the local path (leading slash) or null; link-only records carry
   source_url instead. Same inputs always produce the same array. */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeEntities } from "./html-entities.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "data", "library-index.json");
const manifestsDir = join(root, "..", "bareboard-library-manifests");
const checkOnly = process.argv.includes("--check");
const UNVERIFIED_BASIS = "UNVERIFIED \u2014 provenance not established";

const CATEGORIES = ["manual", "schematic", "documentation", "datasheet",
  "lawsuit", "fda", "fcc", "other"];
const CATEGORY_ORDER = new Map(CATEGORIES.map((name, i) => [name, i]));

/* ---------- text helpers ---------- */

function plainText(fragment) {
  const withoutTags = String(fragment).replace(/<[^>]*>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function titleFromFilename(name) {
  return name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ").trim();
}

function compareText(a, b) {
  const left = String(a == null ? "" : a).toLowerCase();
  const right = String(b == null ? "" : b).toLowerCase();
  return left < right ? -1 : left > right ? 1 : 0;
}

/* ---------- category handling ---------- */

const CATEGORY_SYNONYMS = [
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

function normalizeCategory(value) {
  if (!value) return null;
  const cleaned = String(value).toLowerCase().trim().replace(/[\s_]+/g, "-");
  if (CATEGORIES.includes(cleaned)) return cleaned;
  for (const [category, words] of CATEGORY_SYNONYMS) {
    if (words.includes(cleaned)) return category;
  }
  for (const [category, words] of CATEGORY_SYNONYMS) {
    if (words.some((word) => cleaned.includes(word))) return category;
  }
  return "other";
}

function guessFromPath(relPath) {
  const parts = relPath.toLowerCase().split(/[/\-_]+/);
  const has = (test) => parts.some(test);
  let category = null;
  if (has((t) => t.startsWith("fcc"))) category = "fcc";
  else if (has((t) => t.startsWith("fda"))) category = "fda";
  else if (has((t) => t.includes("lawsuit") || t.includes("litigation"))) category = "lawsuit";
  else if (has((t) => t.includes("schematic"))) category = "schematic";
  else if (has((t) => t.includes("datasheet"))) category = "datasheet";
  else if (has((t) => t.includes("manual"))) category = "manual";
  let platform = null;
  if (parts.includes("pmd")) platform = "Power Mobility (PMD)";
  else if (category === "lawsuit") platform = "Legal";
  return { category, platform };
}

/* Curated metadata for documents already in the library — titles and
   descriptions as published on library.html / datasheets.html. Manifest
   records override these when collection crews land richer data. */
const KNOWN = {
  "/library/collected-public-docs/mandt-blackhat2016-demystifying-sep.pdf": {
    title: "Demystifying the Secure Enclave Processor — Black Hat USA 2016 (Mandt et al.)",
    maker: "Apple", model: "Secure Enclave Processor (SEP)", platform: "Apple",
    category: "documentation", doc_type: "Conference paper (PDF)",
    source_url: "https://blackhat.com/docs/us-16/materials/us-16-Mandt-Demystifying-The-Secure-Enclave-Processor.pdf",
    basis: "Held from the archive.org mirror: no open license on file. Hosted on the site as a publicly published conference paper; license basis not yet established." },
  "/library/collected-public-docs/pangu-mosec2020-attack-secure-boot-of-sep.pdf": {
    title: "Attack Secure Boot of SEP — MOSEC 2020 (Team Pangu)",
    maker: "Apple", model: "Secure Enclave Processor (SEP)", platform: "Apple",
    category: "documentation", doc_type: "Conference paper (PDF)",
    source_url: "https://github.com/windknown/presentations/blob/master/Attack_Secure_Boot_of_SEP.pdf",
    basis: "Held from the archive.org mirror: no open license on file (the author's repository carries no license). Hosted on the site as a publicly published conference paper; license basis not yet established." },
  "/library/collected-public-docs/buhren-blackhat2020-amd-psp.pdf": {
    title: "All You Ever Wanted to Know About the AMD PSP — Black Hat USA 2020 (Buhren et al.)",
    maker: "AMD", model: "Platform Security Processor (PSP)", platform: "AMD",
    category: "documentation", doc_type: "Conference paper (PDF)",
    source_url: "https://github.com/PSPReverse/psp-docs/blob/master/Presentations/BlackHat2020/us-20-BuhrenEichner-All-you-ever-wanted-to-know-about-the-AMD-Platform-Security-Processor-and-were-Afraid-to-Emulate.pdf",
    basis: "Openly licensed (GPL-3.0): the authors' repository PSPReverse/psp-docs distributes this PDF under the GNU GPL v3, which permits verbatim redistribution with attribution." },
  "/library/collected-public-docs/skochinsky-recon2014-intel-me-secrets.pdf": {
    title: "Intel ME Secrets — REcon 2014 (Skochinsky)",
    maker: "Intel", model: "Management Engine (ME/CSME)", platform: "Intel",
    category: "documentation", doc_type: "Conference paper (PDF)",
    source_url: "https://gaspar-ilom.github.io/heads-wiki/PDFs/Recon_2014_Skochinsky.pdf",
    basis: "Held from the archive.org mirror: no open license on file - every slide carries '(c) 2014 Igor Skochinsky'. Hosted on the site as a publicly published conference paper; license basis not yet established." },
  "/library/collected-public-docs/kioxia-xg6-product-brief.pdf": {
    title: "XG6 Client NVMe SSD Product Brief",
    maker: "Kioxia", model: "XG6", platform: "Storage",
    category: "documentation", doc_type: "Product brief (PDF)",
    basis: "Manufacturer-published document, posted with attribution under fair use." },
  "/library/collected-public-docs/skhynix-h9tq27adftmcur-emcp-spec.pdf": {
    title: "H9TQ27ADFTMCUR eMCP Specification",
    maker: "SK hynix", model: "H9TQ27ADFTMCUR", platform: "Storage",
    category: "datasheet", doc_type: "Specification (PDF)",
    basis: "Manufacturer-published document, posted with attribution under fair use." },
  "/library/original-docs/apple-sep-public-reference.md": {
    title: "Apple Secure Enclave — Public Reference",
    maker: "Apple", model: "Secure Enclave Processor (SEP)", platform: "Apple",
    category: "documentation", doc_type: "Original reference (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/original-docs/amd-psp-public-reference.md": {
    title: "AMD PSP — Public Reference",
    maker: "AMD", model: "Platform Security Processor (PSP)", platform: "AMD",
    category: "documentation", doc_type: "Original reference (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/original-docs/intel-csme-public-reference.md": {
    title: "Intel ME/CSME — Public Reference",
    maker: "Intel", model: "Management Engine (ME/CSME)", platform: "Intel",
    category: "documentation", doc_type: "Original reference (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/original-docs/apple-pmic-identification-guide.md": {
    title: "Apple PMIC Identification Guide",
    maker: "Apple", model: "PMIC (multiple)", platform: "Apple",
    category: "documentation", doc_type: "Original guide (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/original-docs/bareboard-10-most-wanted-devices.md": {
    title: "The 10 Most Wanted Devices (full draft)",
    maker: "BareBoard", model: null, platform: "Most Wanted",
    category: "documentation", doc_type: "Original document (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/original-docs/bareboard-watchmen-tool-audit.md": {
    title: "Watchmen Tool Audit Framework",
    maker: "BareBoard", model: null, platform: "Watchmen",
    category: "documentation", doc_type: "Original document (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/original-docs/bareboard-registry-draft.md": {
    title: "Registry — Tiered Documentation Registry (draft)",
    maker: "BareBoard", model: null, platform: "Registry",
    category: "documentation", doc_type: "Original document (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/original-docs/hot100-methodology-notes.md": {
    title: "Hot 100 Methodology Notes",
    maker: "BareBoard", model: null, platform: "Hot 100",
    category: "documentation", doc_type: "Original document (Markdown)",
    basis: "Original work by BareBoard." },
  "/library/trackers/most-wanted-tracker.csv": {
    title: "Most Wanted Tracker",
    maker: "BareBoard", model: null, platform: "Most Wanted",
    category: "other", doc_type: "Tracker (CSV)",
    basis: "Original work by BareBoard." },
  "/library/collected-public-docs/pmd/permobil_m3-corpus_owner.pdf.xml": {
    title: "M3 Corpus User Manual - text extraction (pdf2xml)",
    maker: "Permobil", model: "M3 Corpus", platform: "Power Mobility (PMD)",
    category: "manual", doc_type: "Text extraction (XML)",
    basis: "Derived file: machine text extraction (pdf2xml) of a manufacturer-published document (Permobil M3 Corpus owner manual), posted with attribution under fair use." },
  "/datasheets/NCP302150.pdf": {
    title: "NCP302150 Datasheet",
    maker: "onsemi", model: "NCP302150", platform: "Power",
    category: "datasheet", doc_type: "Datasheet (PDF)",
    basis: "Manufacturer-published document, posted with attribution under fair use." },
  "/datasheets/W25Q16JW.pdf": {
    title: "W25Q16JW Datasheet",
    maker: "Winbond", model: "W25Q16JW", platform: "Memory",
    category: "datasheet", doc_type: "Datasheet (PDF)",
    basis: "Manufacturer-published document, posted with attribution under fair use." },
};

const TYPE_BY_EXTENSION = {
  ".pdf": "PDF", ".md": "Markdown", ".csv": "CSV", ".html": "HTML",
  ".txt": "Text", ".zip": "Archive",
};

/* ---------- the record store ---------- */

const EMPTY_RECORD = {
  title: null, maker: null, model: null, platform: null,
  category: "other", doc_type: null, url: null, source_url: null,
  bytes: null, basis: UNVERIFIED_BASIS,
};
const MERGE_FIELDS = Object.keys(EMPTY_RECORD);
const records = new Map(); // dedupe key -> record

function dedupeKey(record) {
  if (record.url) return "u:" + record.url;
  if (record.source_url) return "s:" + record.source_url;
  return "t:" + [record.title, record.maker, record.model]
    .map((v) => String(v || "").toLowerCase()).join("|");
}

function hasValue(value) {
  return value !== null && value !== undefined;
}

/* Normalize one incoming record, then either store it or merge it into the
   record already held under its key. Merging fills gaps; when
   incomingWins is set (manifests), incoming values overwrite. */
function storeRecord(incoming, incomingWins) {
  const record = { ...EMPTY_RECORD };
  for (const [field, value] of Object.entries(incoming)) {
    if (value !== undefined && value !== "") record[field] = value;
  }
  record.category = normalizeCategory(record.category) || "other";
  record.link_only = !record.url;
  if (!record.basis) record.basis = UNVERIFIED_BASIS;
  const key = dedupeKey(record);
  const held = records.get(key);
  if (!held) {
    records.set(key, record);
    return;
  }
  for (const field of MERGE_FIELDS) {
    if (incomingWins) {
      if (hasValue(record[field])) held[field] = record[field];
    } else if (!hasValue(held[field]) && hasValue(record[field])) {
      held[field] = record[field];
    }
  }
  held.link_only = !held.url;
}

/* ---------- source 1: local files ---------- */

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...listFiles(full));
    else found.push(full);
  }
  return found;
}

let localFiles = 0;
for (const baseDir of ["library/collected-public-docs", "library/original-docs",
  "library/trackers", "datasheets"]) {
  for (const abs of listFiles(join(root, baseDir))) {
    const rel = relative(root, abs).split(sep).join("/");
    const url = "/" + rel;
    const extMatch = rel.match(/\.[a-z0-9]+$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : "";
    const guessed = guessFromPath(rel);
    const curated = KNOWN[url] || {};
    let category = curated.category || guessed.category;
    if (!category) {
      if (baseDir === "datasheets") category = "datasheet";
      else if (guessed.platform === "Power Mobility (PMD)") category = "manual";
      else category = "documentation";
    }
    storeRecord({
      title: curated.title || titleFromFilename(rel.split("/").pop()),
      maker: curated.maker || null,
      model: curated.model !== undefined ? curated.model : null,
      platform: curated.platform || guessed.platform,
      category,
      doc_type: curated.doc_type || TYPE_BY_EXTENSION[ext] ||
        (ext ? ext.slice(1).toUpperCase() : null),
      url,
      source_url: curated.source_url || null,
      bytes: statSync(abs).size,
      basis: curated.basis || UNVERIFIED_BASIS,
    }, false);
    localFiles++;
  }
}

/* ---------- source 2: datasheets.html tables ---------- */

const PLATFORM_BY_SECTION = {
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

let datasheetRows = 0;
let unlinkedRows = 0;
{
  const html = readFileSync(join(root, "datasheets.html"), "utf8");
  /* Walk the page token by token, tracking which section each table row
     belongs to and what that section's heading says. */
  const tokenPattern = /<section id="([^"]+)"|<\/section>|<h2[^>]*>([\s\S]*?)<\/h2>|<table[^>]*class="[^"]*datasheet-table[^"]*"|<\/table>|<tr>([\s\S]*?)<\/tr>/g;
  const openSections = [];
  let insideTable = false;
  let token;
  while ((token = tokenPattern.exec(html)) !== null) {
    const [whole, sectionId, headingHtml, rowHtml] = token;
    if (sectionId !== undefined) {
      openSections.push({ id: sectionId, heading: null });
    } else if (whole === "</section>") {
      openSections.pop();
    } else if (headingHtml !== undefined) {
      if (openSections.length > 0) {
        const top = openSections[openSections.length - 1];
        top.heading = plainText(headingHtml).replace(/\s*\(\d+\)\s*$/, "").trim();
      }
    } else if (whole.startsWith("<table")) {
      insideTable = true;
    } else if (whole === "</table>") {
      insideTable = false;
    } else if (rowHtml !== undefined && insideTable && openSections.length > 0) {
      const cells = [...rowHtml.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
      if (cells.length < 3) continue;
      const link = rowHtml.match(/<a href="([^"]+)"/);
      if (!link) {
        unlinkedRows++;
        continue;
      }
      const href = decodeEntities(link[1]);
      const section = openSections[openSections.length - 1];
      const local = href.startsWith("/");
      storeRecord({
        title: plainText(cells[0]),
        maker: plainText(cells[1]) || null,
        model: null,
        platform: PLATFORM_BY_SECTION[section.id] || section.heading || null,
        category: section.id.includes("schematic") ? "schematic" : "datasheet",
        doc_type: section.heading || "Datasheet index",
        url: local ? href : null,
        source_url: local ? null : href,
        bytes: null,
      }, false);
      datasheetRows++;
    }
  }
}

/* ---------- source 3: rare-manuals.html entries ---------- */

const VINTAGE_PLATFORMS = [
  [/intellivision|mattel/i, "Intellivision"], [/osborne/i, "Osborne"],
  [/kaypro|non linear/i, "Kaypro"], [/apple|macintosh/i, "Apple"],
  [/\bibm\b|international business/i, "IBM PC"], [/commodore|amiga/i, "Commodore"],
  [/atari/i, "Atari"], [/nintendo/i, "Nintendo"], [/sega/i, "Sega"],
  [/sinclair/i, "Sinclair"], [/texas instruments|\bti\b/i, "Texas Instruments"],
  [/hewlett|hp /i, "HP"], [/sony/i, "Sony"], [/tandy|radio shack/i, "Tandy"],
  [/acorn/i, "Acorn"], [/next/i, "NeXT"], [/sun micro/i, "Sun"],
  [/\bdec\b|digital equipment/i, "DEC"], [/xerox/i, "Xerox"],
];
const RARITY_WORDS = {
  onlyknowncopy: "only known copy",
  fewmirrors: "few mirrors",
  severalmirrors: "several mirrors",
};

let manualEntries = 0;
{
  const html = readFileSync(join(root, "rare-manuals.html"), "utf8");
  const chunks = html.split('<article class="manual-entry"').slice(1);
  for (const chunk of chunks) {
    const body = chunk.split("</article>")[0];
    const heading = body.match(/<h3>([\s\S]*?)<\/h3>/);
    if (!heading) continue;
    const title = plainText(heading[1]
      .replace(/<span class="rank">[\s\S]*?<\/span>/, "")
      .replace(/<span class="rarity[^"]*">[\s\S]*?<\/span>/, ""));
    if (!title) continue;
    const decade = (chunk.match(/data-decade="([^"]+)"/) || [])[1] || null;
    const rarityKey = (chunk.match(/data-rarity="([^"]+)"/) || [])[1] || null;
    const rarity = RARITY_WORDS[rarityKey] || rarityKey;
    let maker = null;
    let model = null;
    const makerMatch = body.match(/<strong>Manufacturer:<\/strong>(.*?)<\/p>/);
    if (makerMatch) {
      maker = plainText(makerMatch[1]);
      const paren = maker.match(/\(([^)]*)\)/);
      if (paren) {
        model = paren[1].replace(/^Model\s+/i, "");
        maker = maker.replace(/\s*\([^)]*\)/, "").trim();
      }
    }
    const sourceLink = body.match(/<a href="([^"]+)"[^>]*>\s*Public source\s*<\/a>/);
    const category = /schematics?\b/i.test(title) ? "schematic"
      : /datasheet|data sheet/i.test(title) ? "datasheet" : "manual";
    let platform = "Vintage & Retro";
    const haystack = (maker || "") + " " + title;
    for (const [pattern, name] of VINTAGE_PLATFORMS) {
      if (pattern.test(haystack)) {
        platform = name;
        break;
      }
    }
    let docType = "Rare manual";
    if (decade) docType += " · " + decade;
    if (rarity) docType += " · " + rarity;
    storeRecord({
      title, maker, model, platform, category,
      doc_type: docType,
      url: null,
      source_url: sourceLink ? decodeEntities(sourceLink[1]) : null,
      bytes: null,
    }, false);
    manualEntries++;
  }
}

/* ---------- source 4: collection manifests ---------- */

function firstPresent(obj, names) {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

/* The collection crews' manifests use their own field names: lawsuits carry
   case_name, FCC records carry product/grantee, FDA records carry device and
   k_number, and none of the three carries a category. Map those fields here
   so manifest metadata lands in the index instead of failing validation. */
function categoryFromDocType(docType) {
  if (!docType) return null;
  const text = String(docType).toLowerCase();
  if (text.startsWith("fcc")) return "fcc";
  if (text.startsWith("fda")) return "fda";
  if (["opinion", "order", "legislation", "settlement", "testimony",
    "agency-action", "exemption-ruling", "complaint", "decision",
    "brief", "filing"].includes(text)) return "lawsuit";
  if (["parts", "technical", "owner", "fault-codes", "service",
    "programming", "user-manual", "service-manual"].includes(text)) return "manual";
  return null;
}

function manifestToRecord(raw) {
  let url = firstPresent(raw, ["url", "local_path", "path", "file", "href"]);
  let sourceUrl = firstPresent(raw,
    ["source_url", "source", "original_url", "external_url", "link"]);
  if (url && /^https?:\/\//i.test(url)) {
    if (!sourceUrl) sourceUrl = url;
    url = null;
  }
  if (url) {
    url = String(url);
    if (!url.startsWith("/")) {
      url = url.includes("/")
        ? "/" + url.replace(/^\.?\//, "")
        : "/library/collected-public-docs/" + url;
    }
    url = url.replace(/\/{2,}/g, "/");
  }
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) sourceUrl = null;
  let bytes = firstPresent(raw, ["bytes", "size", "file_size"]);
  bytes = typeof bytes === "number" ? bytes : null;
  if (url && bytes === null) {
    const abs = join(root, url.replace(/^\//, ""));
    if (existsSync(abs)) bytes = statSync(abs).size;
  }
  let title = firstPresent(raw,
    ["title", "name", "document", "doc_title", "case_name", "product"]);
  if (!title && raw.device) {
    title = String(raw.device);
    const kNumber = firstPresent(raw, ["k_number", "k", "510k"]);
    if (kNumber) title += " (" + kNumber + ")";
  }
  const docType = firstPresent(raw, ["doc_type", "format", "file_type"]);
  /* normalizeCategory answers "other" for unknown values; treat that as no
     signal so the doc-type inference below can classify the record. */
  const stated = firstPresent(raw, ["category", "kind", "doc_category"]) ||
    firstPresent(raw, ["type"]);
  const normalized = stated ? normalizeCategory(stated) : null;
  const category = (normalized && normalized !== "other") ? normalized : null;
  return {
    title,
    maker: firstPresent(raw, ["maker", "manufacturer", "vendor", "brand", "company", "grantee"]),
    model: firstPresent(raw, ["model", "device", "product", "part", "part_number"]),
    platform: firstPresent(raw, ["platform", "system", "family"]),
    category: category || categoryFromDocType(docType),
    doc_type: docType,
    url: url || null,
    source_url: sourceUrl || null,
    bytes,
    basis: firstPresent(raw, ["basis"]) || UNVERIFIED_BASIS,
  };
}

let manifestFiles = 0;
let manifestRecords = 0;
if (existsSync(manifestsDir)) {
  for (const abs of listFiles(manifestsDir)) {
    if (!abs.endsWith(".json")) continue;
    manifestFiles++;
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(abs, "utf8"));
    } catch (err) {
      console.error(`WARN: unparseable manifest ${abs}: ${err.message}`);
      continue;
    }
    let list = null;
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && typeof parsed === "object") {
      for (const key of ["documents", "records", "items", "docs", "entries"]) {
        if (Array.isArray(parsed[key])) {
          list = parsed[key];
          break;
        }
      }
      if (!list) {
        const values = Object.values(parsed)
          .filter((v) => v && typeof v === "object" && !Array.isArray(v));
        if (values.length > 0) list = values;
      }
    }
    if (!list) {
      console.error(`WARN: no record list found in manifest ${abs}`);
      continue;
    }
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const record = manifestToRecord(raw);
      if (!record.title && !record.url && !record.source_url) continue;
      if (!record.title && record.url) {
        record.title = titleFromFilename(record.url.split("/").pop());
      }
      storeRecord(record, true);
      manifestRecords++;
    }
  }
}

/* ---------- sort, validate, write ---------- */

const docs = [...records.values()].sort((a, b) =>
  (CATEGORY_ORDER.get(a.category) - CATEGORY_ORDER.get(b.category)) ||
  compareText(a.platform || "\uffff", b.platform || "\uffff") ||
  compareText(a.title, b.title) ||
  compareText(a.url || a.source_url, b.url || b.source_url));

const problems = [];
for (const doc of docs) {
  if (!doc.title) {
    problems.push("record missing title: " + JSON.stringify(doc).slice(0, 120));
  }
  if (!CATEGORIES.includes(doc.category)) {
    problems.push(doc.title + ": bad category " + doc.category);
  }
  if (doc.url && !existsSync(join(root, doc.url.replace(/^\//, "")))) {
    problems.push(doc.title + ": local url does not exist: " + doc.url);
  }
  if (!doc.url && !doc.source_url) {
    problems.push(doc.title + ": neither url nor source_url");
  }
  if (doc.link_only !== !doc.url) {
    problems.push(doc.title + ": link_only flag inconsistent");
  }
  if (!doc.basis) problems.push(doc.title + ": missing basis");
}
if (problems.length > 0) {
  console.error("INVALID library index:");
  for (const message of problems) console.error(" - " + message);
  process.exit(1);
}

const counts = {};
for (const category of CATEGORIES) counts[category] = 0;
for (const doc of docs) counts[doc.category]++;

const output = {
  version: 1,
  generated: new Date().toISOString().slice(0, 10),
  total: docs.length,
  counts,
  documents: docs,
};
if (!checkOnly) writeFileSync(outFile, JSON.stringify(output, null, 2) + "\n");

const localDocs = docs.filter((d) => d.url).length;
console.log(`OK: ${docs.length} documents (${localDocs} local, ${docs.length - localDocs} link-only)` +
  (checkOnly ? " (check only)" : `; wrote ${outFile}`));
console.log("by category: " + CATEGORIES.map((c) => `${c}=${counts[c]}`).join(" "));
console.log(`sources: ${localFiles} local files, ${datasheetRows} datasheet rows ` +
  `(${unlinkedRows} unlinked rows skipped), ${manualEntries} rare manuals, ` +
  `${manifestRecords} manifest records from ${manifestFiles} manifest file(s)`);
