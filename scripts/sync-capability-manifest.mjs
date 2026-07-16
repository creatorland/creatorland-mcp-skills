#!/usr/bin/env node
// -----------------------------------------------------------------------------
// Refresh the vendored capability manifest from the live MCP server (SSOT).
//
// WHY (CRE-1055, epic CRE-1050 "anti-drift"):
//   The MCP server publishes a live capability manifest — plans, per-tool credit
//   costs, connect/resource URLs, market-intel floors — at
//   https://data-mcp.creatorland.com/capabilities.json. That endpoint is the
//   SINGLE SOURCE OF TRUTH. This repo's shared/conventions.md restates a subset
//   of those facts for skill authors, and it can silently DRIFT when the server
//   changes. So we vendor the manifest into the repo and CI-guard conventions.md
//   against it (see scripts/check-conventions-matches-manifest.mjs).
//
//   This script is the HUMAN-RUN refresh: pull the live manifest, strip the
//   volatile `generated_at` timestamp (so re-runs produce no-op diffs when
//   nothing real changed), and write it pretty-printed to the vendored path.
//   Run it whenever the server's capabilities change, then commit the result
//   and reconcile conventions.md until the guard passes.
//
//   Mirrors the site repo's manifest-vendoring pattern (site PR #205).
//
// Dependency-free ESM — global fetch (Node 18+), node:fs / node:path only.
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST_URL =
  process.env.CAPABILITIES_URL ||
  'https://data-mcp.creatorland.com/capabilities.json';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VENDORED_PATH = join(
  repoRoot,
  'plugins',
  'creatorland-data',
  'shared',
  'capability-manifest.json',
);

// Fields that change on every server response but carry no capability meaning.
const VOLATILE_KEYS = ['generated_at'];

function stripVolatile(obj) {
  const copy = { ...obj };
  for (const k of VOLATILE_KEYS) delete copy[k];
  return copy;
}

function summarize(manifest) {
  const plans = (manifest.plans || [])
    .map((p) => `${p.name}=${p.monthly_credit_grant ?? '—'}`)
    .join(', ');
  const tools = (manifest.tools || [])
    .map((t) => `${t.name}:${t.credits}`)
    .join(', ');
  return { plans, tools };
}

async function main() {
  console.log(`Fetching live capability manifest: ${MANIFEST_URL}`);
  const res = await fetch(MANIFEST_URL, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    console.error(`FAIL: ${res.status} ${res.statusText} from ${MANIFEST_URL}`);
    process.exit(1);
  }
  const live = await res.json();
  const next = stripVolatile(live);
  const nextJson = JSON.stringify(next, null, 2) + '\n';

  let prev = null;
  if (existsSync(VENDORED_PATH)) {
    try {
      prev = JSON.parse(readFileSync(VENDORED_PATH, 'utf8'));
    } catch {
      prev = null;
    }
  }

  mkdirSync(dirname(VENDORED_PATH), { recursive: true });
  writeFileSync(VENDORED_PATH, nextJson);

  const rel = VENDORED_PATH.slice(repoRoot.length + 1);
  if (prev === null) {
    console.log(`\nVendored NEW manifest → ${rel}`);
  } else if (JSON.stringify(prev) === JSON.stringify(next)) {
    console.log(`\nNo change — vendored manifest already up to date (${rel}).`);
  } else {
    console.log(`\nUpdated vendored manifest → ${rel}`);
  }

  const s = summarize(next);
  console.log(`\nSummary of live capabilities:`);
  console.log(`  manifest_version: ${next.manifest_version}`);
  console.log(`  connect_url:      ${next.connect_url}`);
  console.log(`  resource_url:     ${next.resource_url}`);
  console.log(`  plans:            ${s.plans}`);
  console.log(`  tool credits:     ${s.tools}`);
  console.log(
    `\nNext: reconcile conventions.md, then run ` +
      `\`node scripts/check-conventions-matches-manifest.mjs\` until it passes.`,
  );
}

main().catch((err) => {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
});
