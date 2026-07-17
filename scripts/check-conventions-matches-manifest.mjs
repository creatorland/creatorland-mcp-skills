#!/usr/bin/env node
// -----------------------------------------------------------------------------
// Anti-drift guard: shared/conventions.md must agree with the vendored
// capability manifest (the SSOT snapshot).
//
// WHY (CRE-1055, epic CRE-1050 "anti-drift"):
//   The live MCP server publishes the authoritative capability manifest
//   (plans, per-tool credit costs, connect URL) at
//   https://data-mcp.creatorland.com/capabilities.json. We vendor a snapshot of
//   it into this repo (scripts/sync-capability-manifest.mjs writes
//   plugins/creatorland-data/shared/capability-manifest.json). shared/
//   conventions.md restates a subset of those facts for skill authors and can
//   silently DRIFT out of sync when the server changes. This guard FAILS the
//   build the moment conventions.md contradicts the vendored manifest on any of
//   the plan / tool-cost / connect-URL facts below.
//
//   NO NETWORK at check time — reads the vendored manifest ONLY, so CI is
//   deterministic and offline. Refresh the snapshot with the sync script; this
//   guard then holds conventions.md to it. Mirrors site PR #205.
//
// WHAT IT ASSERTS:
//   1. Free plan grant (250) and Pro plan grant (2000) from the manifest appear
//      as the stated plan credits in conventions.md.
//   2. Each tool's per-call credit cost in conventions.md's price-index table
//      matches the manifest's `credits` for that tool. SPECIAL CASE:
//      `enrich_matches` bills DYNAMICALLY, so its static manifest weight is 0
//      while conventions describes the real rate "3 per matched creator" — the
//      guard asserts that dynamic-rate phrasing instead of the static 0.
//   3. The connect URL in conventions.md matches the manifest `connect_url`.
//
// Dependency-free ESM — node:fs / node:path only. Exit 1 with per-fact
// mismatches on drift; exit 0 with an OK line when consistent.
// -----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(repoRoot, 'plugins', 'creatorland-data', 'shared');
const MANIFEST_PATH = join(SHARED, 'capability-manifest.json');
const CONVENTIONS_PATH = join(SHARED, 'conventions.md');

function loadOrDie(path, label, parse) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    console.error(`FAIL: could not read ${label} at ${path}: ${err.message}`);
    process.exit(2);
  }
  return parse ? JSON.parse(raw) : raw;
}

const manifest = loadOrDie(MANIFEST_PATH, 'vendored manifest', true);
const conventions = loadOrDie(CONVENTIONS_PATH, 'conventions.md', false);

const mismatches = [];
function fail(fact, manifestValue, conventionsValue) {
  mismatches.push({ fact, manifestValue, conventionsValue });
}

// --- 1. Plan credit grants -----------------------------------------------
// Manifest grants can be written with thousands separators in prose
// (2000 -> "2,000"), so match an optional comma before each 3-digit group.
function grantRegex(n) {
  const grouped = n.toLocaleString('en-US').replace(/,/g, ',?');
  return new RegExp(`\\b${grouped}\\s+credits\\b`, 'i');
}
for (const planName of ['free', 'pro']) {
  const plan = (manifest.plans || []).find((p) => p.name === planName);
  if (!plan || plan.monthly_credit_grant == null) {
    fail(
      `${planName} plan grant`,
      'present in manifest',
      `manifest has no numeric grant for "${planName}"`,
    );
    continue;
  }
  const grant = plan.monthly_credit_grant;
  if (!grantRegex(grant).test(conventions)) {
    fail(
      `${planName} plan grant`,
      `${grant} credits`,
      'not stated in conventions.md',
    );
  }
}

// --- 2. Per-tool credit costs (conventions.md price-index table) ----------
// Parse two-column markdown rows: | `tool` (notes) | value... |
// A row may name two tools in one cell (e.g. get_connection_status /
// list_connections) — apply its value to each named tool.
const toolCells = new Map(); // toolName -> raw value cell text
for (const line of conventions.split(/\r?\n/)) {
  const row = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
  if (!row) continue;
  const nameCell = row[1];
  const valueCell = row[2];
  const names = [...nameCell.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
  for (const name of names) {
    if (!toolCells.has(name)) toolCells.set(name, valueCell);
  }
}

function cellToCredits(cell) {
  if (/free/i.test(cell)) return 0;
  const m = cell.match(/\b(\d+)\b/);
  return m ? parseInt(m[1], 10) : null;
}

for (const tool of manifest.tools || []) {
  const cell = toolCells.get(tool.name);

  // SPECIAL CASE: enrich_matches bills dynamically. Manifest static weight is
  // 0; conventions must describe the real "3 per matched creator" rate.
  if (tool.name === 'enrich_matches') {
    if (!/3\s+per\s+matched\s+creator/i.test(conventions)) {
      fail(
        'enrich_matches dynamic rate',
        '3 per matched creator (dynamic; static weight 0)',
        cell == null
          ? 'not in price index'
          : `"${cell}" (missing "3 per matched creator")`,
      );
    }
    continue;
  }

  // Tools not restated in the price index (e.g. health) are not policed here.
  if (cell == null) continue;

  const stated = cellToCredits(cell);
  if (stated !== tool.credits) {
    fail(
      `${tool.name} credit cost`,
      String(tool.credits),
      stated == null ? `unparseable ("${cell}")` : String(stated),
    );
  }
}

// --- 3. Connect URL -------------------------------------------------------
const connectUrl = manifest.connect_url;
if (!connectUrl) {
  fail('connect URL', 'present in manifest', 'manifest has no connect_url');
} else if (!conventions.includes(connectUrl)) {
  const found = conventions.match(/https?:\/\/[^\s`)]+\/mcp\b/);
  fail(
    'connect URL',
    connectUrl,
    found ? found[0] : 'no MCP connect URL found in conventions.md',
  );
}

// --- Report ---------------------------------------------------------------
if (mismatches.length > 0) {
  console.error(
    'FAIL: conventions.md has drifted from the vendored capability manifest\n' +
      '(plugins/creatorland-data/shared/capability-manifest.json — the SSOT\n' +
      'snapshot). Reconcile conventions.md to the manifest (the server is\n' +
      'authoritative), or refresh the snapshot with\n' +
      '`node scripts/sync-capability-manifest.mjs` if the server changed.\n' +
      'See CRE-1055 (epic CRE-1050).\n',
  );
  for (const m of mismatches) {
    console.error(
      `  - ${m.fact}: manifest = ${m.manifestValue} | conventions = ${m.conventionsValue}`,
    );
  }
  console.error(`\n${mismatches.length} mismatch(es).`);
  process.exit(1);
}

console.log(
  'OK: conventions.md is consistent with the vendored capability manifest ' +
    '(plan grants, per-tool credit costs, connect URL).',
);
process.exit(0);
