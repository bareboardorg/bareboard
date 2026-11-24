#!/usr/bin/env node
/* Validate data/most-wanted.json and rebuild most-wanted-tracker.csv.
   Dependency-free. Usage: node tools/build-tracker.mjs [--check]
   With --check the board is validated but the CSV is left untouched. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const boardFile = join(root, "data", "most-wanted.json");
const csvFile = join(root, "most-wanted-tracker.csv");
const checkOnly = process.argv.includes("--check");

const ALLOWED_PRIORITIES = ["HIGH PRIORITY", "ELEVATED", "STANDARD"];
const ALLOWED_STATUSES = ["wanted", "claimed", "on-the-bench", "documented"];
const ALLOWED_CATEGORIES = ["wearable", "handheld", "headset", "drone",
  "home-robot", "console", "fitness", "phone", "computer", "mobility",
  "chip", "document-target", "other"];
const SCORE_KEYS = ["rarity", "darkness", "reach"];
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

const problems = [];
const board = JSON.parse(readFileSync(boardFile, "utf8"));

function flag(message) { problems.push(message); }

if (board.version !== 1) flag("version must be 1");
if (!DATE_SHAPE.test(board.updated || "")) flag("updated must be YYYY-MM-DD");
for (const list of ["entries", "graduated"]) {
  if (!Array.isArray(board[list])) flag(list + " must be an array");
}

const roster = [...(board.entries || []), ...(board.graduated || [])];
const idsSeen = new Set();
for (const entry of roster) {
  const tag = entry && entry.id ? entry.id : "(missing id)";
  if (!entry.id || !ID_SHAPE.test(entry.id)) flag(tag + ": bad id");
  if (idsSeen.has(entry.id)) flag(tag + ": duplicate id");
  idsSeen.add(entry.id);
  if (!entry.name) flag(tag + ": missing name");
  if (!ALLOWED_CATEGORIES.includes(entry.category)) {
    flag(tag + ": bad category " + entry.category);
  }
  if (!entry.soughtFor) flag(tag + ": missing soughtFor");
  if (!entry.whyItMatters) flag(tag + ": missing whyItMatters");
  if (!ALLOWED_PRIORITIES.includes(entry.priority)) {
    flag(tag + ": bad priority " + entry.priority);
  }
  if (!ALLOWED_STATUSES.includes(entry.status)) {
    flag(tag + ": bad status " + entry.status);
  }
  for (const key of SCORE_KEYS) {
    const value = entry.scores ? entry.scores[key] : undefined;
    if (value !== null && (typeof value !== "number" || value < 0 || value > 10)) {
      flag(tag + ": score " + key + " must be null or 0-10");
    }
  }
  if (["claimed", "on-the-bench", "documented"].includes(entry.status) && !entry.claim) {
    flag(tag + ": status " + entry.status + " requires a claim");
  }
  if (entry.status === "documented" && !(entry.links && entry.links.autopsy)) {
    flag(tag + ": documented requires links.autopsy");
  }
  if (!Array.isArray(entry.history)) flag(tag + ": history must be an array");
}
for (const entry of board.graduated || []) {
  if (entry.status !== "documented") {
    flag(entry.id + ": graduated entries must be status documented");
  }
}

if (problems.length > 0) {
  console.error("INVALID most-wanted.json:");
  for (const message of problems) console.error(" - " + message);
  process.exit(1);
}

/* Weighted score: rarity counts most, then darkness, then reach. Any
   missing component leaves the score blank rather than guessed. */
function weightedScore(entry) {
  const s = entry.scores;
  if ([s.rarity, s.darkness, s.reach].some((v) => v === null)) return "";
  return (0.5 * s.rarity + 0.3 * s.darkness + 0.2 * s.reach).toFixed(2);
}

function csvField(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function entryRow(rank, entry) {
  return [rank, entry.id, entry.name, entry.category, entry.priority,
    entry.status, entry.scores.rarity ?? "", entry.scores.darkness ?? "",
    entry.scores.reach ?? "", weightedScore(entry),
    entry.claim ? entry.claim.by : "", entry.links.autopsy || ""];
}

const rows = [["rank", "id", "name", "category", "priority", "status",
  "rarity", "darkness", "reach", "score", "claimed_by", "autopsy"]];
(board.entries || []).forEach((entry, i) => rows.push(entryRow(i + 1, entry)));
(board.graduated || []).forEach((entry) => rows.push(entryRow("graduated", entry)));

if (!checkOnly) {
  writeFileSync(csvFile, rows.map((r) => r.map(csvField).join(",")).join("\n") + "\n");
}
console.log(`OK: ${board.entries.length} on the board, ${board.graduated.length} graduated` +
  (checkOnly ? " (check only)" : `; wrote ${csvFile}`));
