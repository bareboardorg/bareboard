#!/usr/bin/env node
/* Validate data/most-wanted.json and regenerate most-wanted-tracker.csv.
   Dependency-free. Usage: node tools/build-tracker.mjs [--check]
   --check validates only, without writing the CSV. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const boardPath = join(root, "data", "most-wanted.json");
const csvPath = join(root, "most-wanted-tracker.csv");
const checkOnly = process.argv.includes("--check");

const PRIORITIES = ["HIGH PRIORITY", "ELEVATED", "STANDARD"];
const STATUSES = ["wanted", "claimed", "on-the-bench", "documented"];
const CATEGORIES = ["wearable", "handheld", "headset", "drone", "home-robot",
  "console", "fitness", "phone", "computer", "mobility", "chip",
  "document-target", "other"];

const errors = [];
const board = JSON.parse(readFileSync(boardPath, "utf8"));

if (board.version !== 1) errors.push("version must be 1");
if (!/^\d{4}-\d{2}-\d{2}$/.test(board.updated || "")) errors.push("updated must be YYYY-MM-DD");
for (const listName of ["entries", "graduated"]) {
  if (!Array.isArray(board[listName])) errors.push(listName + " must be an array");
}
const all = [...(board.entries || []), ...(board.graduated || [])];
const seen = new Set();
for (const e of all) {
  const tag = e && e.id ? e.id : "(missing id)";
  if (!e.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) errors.push(tag + ": bad id");
  if (seen.has(e.id)) errors.push(tag + ": duplicate id");
  seen.add(e.id);
  if (!e.name) errors.push(tag + ": missing name");
  if (!CATEGORIES.includes(e.category)) errors.push(tag + ": bad category " + e.category);
  if (!e.soughtFor) errors.push(tag + ": missing soughtFor");
  if (!e.whyItMatters) errors.push(tag + ": missing whyItMatters");
  if (!PRIORITIES.includes(e.priority)) errors.push(tag + ": bad priority " + e.priority);
  if (!STATUSES.includes(e.status)) errors.push(tag + ": bad status " + e.status);
  for (const k of ["rarity", "darkness", "reach"]) {
    const v = e.scores ? e.scores[k] : undefined;
    if (v !== null && (typeof v !== "number" || v < 0 || v > 10)) {
      errors.push(tag + ": score " + k + " must be null or 0-10");
    }
  }
  if ((e.status === "claimed" || e.status === "on-the-bench" || e.status === "documented") && !e.claim) {
    errors.push(tag + ": status " + e.status + " requires a claim");
  }
  if (e.status === "documented" && !(e.links && e.links.autopsy)) {
    errors.push(tag + ": documented requires links.autopsy");
  }
  if (!Array.isArray(e.history)) errors.push(tag + ": history must be an array");
}
for (const e of board.graduated || []) {
  if (e.status !== "documented") errors.push(e.id + ": graduated entries must be status documented");
}

if (errors.length) {
  console.error("INVALID most-wanted.json:");
  for (const m of errors) console.error(" - " + m);
  process.exit(1);
}

function score(e) {
  const s = e.scores;
  if ([s.rarity, s.darkness, s.reach].some(v => v === null)) return "";
  return (0.5 * s.rarity + 0.3 * s.darkness + 0.2 * s.reach).toFixed(2);
}
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const rows = [["rank", "id", "name", "category", "priority", "status",
  "rarity", "darkness", "reach", "score", "claimed_by", "autopsy"]];
(board.entries || []).forEach((e, i) => rows.push([
  i + 1, e.id, e.name, e.category, e.priority, e.status,
  e.scores.rarity ?? "", e.scores.darkness ?? "", e.scores.reach ?? "",
  score(e), e.claim ? e.claim.by : "", e.links.autopsy || ""
]));
(board.graduated || []).forEach(e => rows.push([
  "graduated", e.id, e.name, e.category, e.priority, e.status,
  e.scores.rarity ?? "", e.scores.darkness ?? "", e.scores.reach ?? "",
  score(e), e.claim ? e.claim.by : "", e.links.autopsy || ""
]));

if (!checkOnly) writeFileSync(csvPath, rows.map(r => r.map(csvCell).join(",")).join("\n") + "\n");
console.log(`OK: ${board.entries.length} on the board, ${board.graduated.length} graduated` +
  (checkOnly ? " (check only)" : `; wrote ${csvPath}`));
