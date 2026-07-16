#!/usr/bin/env node
// -----------------------------------------------------------------------------
// Skill drift guard: no hardcoded PLAN-LEVEL facts in individual skills.
//
// WHY (CRE-1052, epic CRE-1050 "anti-drift"):
//   Plan-level facts — the Pro credit grant, the Pro price, the credit-pack
//   price, and infrastructure hosts — change over time. When an individual
//   skill's SKILL.md hardcodes one of them, it silently DRIFTS out of sync the
//   moment the real number moves. This is not hypothetical: PR #21 had to clean
//   up three skills (credit-budget-guardian, onboarding-tour,
//   outreach-spend-forecaster) that each hardcoded "5,000 credits / $199" —
//   already stale versus the canonical figure in shared/conventions.md.
//
// THE RULE:
//   Plan-level facts live in EXACTLY ONE place — plugins/creatorland-data/
//   shared/conventions.md — so every skill inherits them and none can drift.
//   Individual skills must reference "see conventions.md", never restate the
//   numbers. This script FAILS a PR (exit 1) if any scanned SKILL.md restates
//   one of the banned plan-level facts, printing every offending
//   `path:line: matched text`.
//
// SCOPE (deliberately narrow):
//   Scans ONLY plugins/creatorland-data/skills/*/SKILL.md — the individual
//   skills. It does NOT scan shared/** (that IS the home for these facts) and
//   does NOT scan any README (e.g. Vellum's plugin README is out of scope).
//
// Per-tool costs like "2 credits" are single/low-double-digit and are NOT
// plan-level facts — the credit-grant pattern only matches thousands values,
// so it will not trip on them. Do NOT weaken these patterns to make an
// offending skill pass; the fix is to move the fact into conventions.md.
//
// Dependency-free ESM (node:fs / node:path only) — runs on a bare GitHub
// Actions runner with no npm install.
// -----------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(
  repoRoot,
  'plugins',
  'creatorland-data',
  'skills',
);

// Banned PLAN-LEVEL patterns. Each entry: { name, re }.
// Keep in sync with shared/conventions.md as the single source of truth.
const BANNED = [
  {
    name: 'plan credit grant (thousands + "credits")',
    // Catches "5,000 credits", "2000 credits" — plan-level grants.
    // Per-tool costs ("2 credits") are single/low-double digits: no match.
    re: /\b\d{1,2},?000\s+credits\b/i,
  },
  {
    name: 'Pro plan price ($199)',
    re: /\$199\b/,
  },
  {
    name: 'credit-pack price ($25 / 1,000)',
    re: /\$25\s*\/\s*1,?000/,
  },
  {
    name: 'raw Cloud Run host (mcp-server-609509006565)',
    re: /mcp-server-609509006565/,
  },
];

function skillMdFiles() {
  let entries;
  try {
    entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  } catch (err) {
    console.error(`Could not read skills dir ${SKILLS_DIR}: ${err.message}`);
    process.exit(2);
  }
  const files = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = join(SKILLS_DIR, entry.name, 'SKILL.md');
    try {
      if (statSync(candidate).isFile()) files.push(candidate);
    } catch {
      // No SKILL.md in this dir — skip.
    }
  }
  return files.sort();
}

function relPath(abs) {
  return abs.slice(repoRoot.length + 1);
}

const offenses = [];
for (const file of skillMdFiles()) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { name, re } of BANNED) {
      const m = line.match(re);
      if (m) {
        offenses.push({
          path: relPath(file),
          line: i + 1,
          rule: name,
          text: line.trim(),
        });
      }
    }
  });
}

if (offenses.length > 0) {
  console.error(
    'FAIL: hardcoded plan-level fact(s) found in individual skill(s).\n' +
      'Plan-level facts (Pro credit grant, $199 price, $25/1,000 pack price,\n' +
      'infra hosts) must live ONLY in plugins/creatorland-data/shared/' +
      'conventions.md\n' +
      'so they cannot drift. Replace the hardcoded value with a reference to\n' +
      'conventions.md. See CRE-1052 (epic CRE-1050).\n',
  );
  for (const o of offenses) {
    console.error(`${o.path}:${o.line}: [${o.rule}] ${o.text}`);
  }
  console.error(`\n${offenses.length} offending line(s).`);
  process.exit(1);
}

console.log('OK: no hardcoded plan-level facts in individual skills');
process.exit(0);
