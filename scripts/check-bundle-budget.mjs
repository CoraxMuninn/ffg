#!/usr/bin/env node
/**
 * Bundle budget check (Roadmap Task 7.7 / PERF-L5).
 *
 * A dependency-free guard that fails when the production build's shared client
 * payload (`.next/static/chunks`) grows past the limits in `perf-budget.json`.
 * Run after `next build` — in CI and via `npm run perf:budget`. Limits are
 * calibrated to the post-Phase-7 baseline plus headroom, so a real regression
 * (a new dependency, an accidental client boundary, a duplicated bundle) fails
 * the gate while ordinary feature work does not.
 *
 * Note on RUM (PERF-L5 decision gate): field/Web-Vitals monitoring is NOT added
 * here. It requires a privacy-reviewed endpoint/provider and a retention policy,
 * which need explicit operator approval (and a privacy-policy update) before
 * any collection begins. See docs/PERFORMANCE.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CHUNKS_DIR = path.join(ROOT, ".next", "static", "chunks");
const BUDGET_PATH = path.join(ROOT, "perf-budget.json");

if (!fs.existsSync(BUDGET_PATH)) {
  console.error("✖ perf-budget.json not found.");
  process.exit(1);
}
if (!fs.existsSync(CHUNKS_DIR)) {
  console.error("✖ .next/static/chunks not found — run `next build` first.");
  process.exit(1);
}

const budget = JSON.parse(fs.readFileSync(BUDGET_PATH, "utf8"));

function totalSize(dir, ext) {
  let total = 0;
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(ext));
  for (const name of files) {
    total += fs.statSync(path.join(dir, name)).size;
  }
  return { total, count: files.length };
}

const js = totalSize(CHUNKS_DIR, ".js");
const css = totalSize(CHUNKS_DIR, ".css");

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
const fmt = (label, { total, count }, limit) =>
  `${label.padEnd(16)} ${kb(total).padStart(10)}  (${count} files)  limit ${kb(limit)}`;

let failed = false;
const checks = [
  { label: "Client JS", total: js.total, count: js.count, limit: budget.maxChunkJsBytes },
  { label: "Client CSS", total: css.total, count: css.count, limit: budget.maxChunkCssBytes },
];

console.log("Performance budget — .next/static/chunks");
for (const c of checks) {
  console.log("  " + fmt(c.label, c, c.limit));
  if (c.total > c.limit) {
    console.error(`  ✖ ${c.label} exceeds budget by ${kb(c.total - c.limit)}.`);
    failed = true;
  }
}

if (failed) {
  console.error(
    "\n✖ Budget exceeded. If the growth is intentional, raise the limit in perf-budget.json.",
  );
  process.exit(1);
}
console.log("\n✓ Within budget.");
