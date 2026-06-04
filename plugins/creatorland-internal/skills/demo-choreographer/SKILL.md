---
name: demo-choreographer
description: Pre-validated golden-path demo prep for Creatorland AEs — runs the prospect's planned demo calls NOW against prod, auto-substitutes the nearest dense vertical if anything hits a privacy floor or comes back thin (always flagging the swap), and emits a timed demo runbook with exact copy-paste prompts, expected outputs, talk-track beats, tier-upsell moment, and objection Q&A. Use when an AE says "prep a demo for [prospect]", "demo script", "golden path for tomorrow's call", "build the [vertical] demo", or any prospect-call prep. Regenerate same-day — data drifts.
---

# Demo Choreographer (internal — sales)

Kills live-demo roulette. The min-N privacy floors that protect the product
are exactly what can embarrass an unscripted demo; this skill runs the whole
demo against prod *before* the call, so the AE walks in with a runbook where
every prompt has a known, impressive answer — and the guardrails become a
rehearsed trust beat instead of a surprise refusal. Deliverable: a timed demo
runbook validated against prod within the last hour.

Internal use only. Demo runs consume Creatorland-controlled credits, not a
customer's grant. Tool surface and floors (ground truth, mirrored from the
customer plugin's `creatorland-data/shared/conventions.md` — re-check there
if anything seems off):

- `search_creators` — 2 credits. `mode: "brief"` (free-text `brief` ≤2000
  chars and/or `filters`) or `mode: "lookalike"` (one of `seed_creator` /
  `seed_content`). `limit` 1–150, `precision` broad|balanced|tight.
- `get_creator_profile` — 1 credit. `{ identifier: { type: ... } }`, one of
  `social_handle | creatorland_user_id | source_user | email | phone`.
  Returns freshness + (pro) brand affiliations.
- `query_market_intelligence` — 5 credits, pro. `mode: "market"` or
  `"rate"`; filters `vertical`, `sub_category`, `company_type`, `deal_type`,
  `active_since`; rate mode takes `quoted_rate`. **Floors: market ≥5 brands /
  ≥25 deals; rate ≥10 brands / ≥50 deals.** Refused slices get broadened one
  constraint at a time (deal_type → sub_category → active_since →
  company_type → vertical-only), and every broaden is disclosed.
- Credit prices: profile 1 / search 2 / market intel 5 ($0.025 each).
  Pro = $199/mo, 5,000 credits. Free tier = discovery only, small grant.

## Inputs to collect from the AE

1. **Prospect** — company/agency name.
2. **Their world** — primary vertical(s) and 1–3 example client brands
   (e.g., "mid-size agency, mostly Beauty and Fitness, clients include
   Glossier"). This is what makes the demo feel bespoke.
3. **Demo length** — 15 or 30 minutes (default 30).
4. **Plan being evaluated** — free trial, pro, or pilot (shapes the upsell
   beat).

Defaults if the AE is rushed: 30 min, pro evaluation, Beauty vertical. Never
ask twice — pull missing details from CRM/Slack context if available before
asking.

## Flow

### Phase 1 — Pre-flight validation (run the demo NOW, ~15–25 credits)

Run every call the demo will make, today, against prod:

1. **Market intel on the prospect's vertical:**
   `query_market_intelligence` `{ mode: "market", vertical: "<prospect vertical>" }`.
   PASS = clears the floor with impressive numbers (hundreds of brands,
   thousands of deals — numbers an AE can say out loud proudly). If the
   prospect's pitch includes pricing, also validate
   `{ mode: "rate", vertical: "<vertical>", deal_type: "<typical for them>" }`
   and note at what level the rate floor (10 brands / 50 deals) clears.
2. **Brief-mode search written in the prospect's world:**
   `search_creators` `{ mode: "brief", brief: "<a dense, natural brief using the prospect's vertical and an example client brand's positioning>", limit: 8, precision: "balanced" }`.
   PASS = strong, on-brief, recognizable results — the kind the prospect's
   casting team would nod at.
3. **Profile depth check on 2–3 returned creators:**
   `get_creator_profile` `{ identifier: { type: "social_handle", platform: "<from result>", "handle": "<from result>" } }`
   for each. PASS = rich profiles, **fresh** sync timestamps, **affiliations
   present** (this is the pro wow-field — if affiliations are sparse on all
   three, pick different creators from the search results and re-check).

### Phase 2 — Substitution rule (when anything floors or thins)

If any pre-flight step refuses, broadens heavily, or returns thin/stale
results in the prospect's vertical:

- **Substitute the nearest dense vertical** for that demo beat. Walk
  sub_category → parent vertical first; if the prospect's whole vertical is
  thin, fall back to **Beauty (3,249 brands / 18,052 deals — the reliable
  showcase)**. Re-run the pre-flight calls on the substitute until all three
  steps PASS.
- **FLAG every substitution to the AE, prominently, in the runbook** — a
  "Substitutions" box at the top: what was swapped, why (floor/thin), and
  the exact honest line to use live ("your specific niche sits under our
  privacy minimums today — here's the parent vertical, and here's why that
  floor protects your deal data too"). The AE must never overclaim coverage
  the corpus lacks; the substitution note is also competitive intel for the
  roadmap team.

### Phase 3 — Generate the runbook

Build the deliverable below entirely from pre-flight outputs — every
"expected output" is a real snapshot from Phase 1, never invented. Optional
closer: pre-stage a Brief-to-Shortlist run themed to one of the prospect's
actual client brands (one extra search + 3–5 profiles, ~5–7 credits) so the
demo ends on "imagine this for <their client>".

## Deliverable — the demo runbook

```markdown
# Demo runbook — <Prospect> · <date, time generated> · validated against prod <N> min ago
**Plan in play:** <free/pro/pilot> · **Length:** <15/30> min · **Vertical:** <vertical>

## ⚠ Substitutions (if any)
<What was swapped, why, and the honest live line. If none: "None — prospect's vertical validated clean.">

## Timed agenda
| Time | Beat | Prompt to paste | Expected output (from today's pre-flight) | Talk track |
|---|---|---|---|---|
| 0:00 | Hook: their market in numbers | "<market-intel prompt>" | <real stat + provenance line, verbatim> | "Point at the provenance line — brand count, deal count, recency. That's the trust moment: every number is citation-ready." |
| 0:05 | Search in their world | "<brief-mode prompt>" | <top 3 results snapshot> | "Plain English in, ranked creators out — no query language. Name-check the result their team will recognize." |
| 0:12 | Profile deep-dive | "<profile prompt for the strongest pre-flight creator>" | <freshness + affiliations snapshot> | "Freshness timestamp = never pitch on stale data. Affiliations = instant conflict check before you pitch <example client brand>'s competitor." |
| 0:18 | Tier-upsell beat | same profile/intel query, free vs pro framing | <gated vs full field comparison> | "Same query, two tiers — affiliations and market intel are the pro unlock. $199/mo, 5,000 credits; one avoided overpay covers the year." |
| 0:24 | Closer (optional) | "<staged Brief-to-Shortlist prompt for their client>" | <shortlist snapshot> | "Imagine this artifact landing in your <client> deck tomorrow." |

## Objection Q&A (answers grounded in today's validated runs)
- **"What do credits cost?"** — $0.025 each; today's whole demo = ~<N> credits (~$<X>). Profile 1 / search 2 / market intel 5. A typical shortlist run is 15–25 credits.
- **"Why did that query widen?" / privacy floors** — Stats need ≥5 brands/25 deals (market) or ≥10/50 (rate) behind them, so no single company's deals leak — including theirs once they're a customer. The widening is always disclosed, never silent.
- **"How fresh is the data?"** — Read the freshness field from today's profile pulls: <actual values>. Every profile carries its own sync timestamp.
- **"Do you have creator contact info?"** — No, by design; the MCP never returns PII. Connections route through Creatorland.

## Pre-flight log
<Each call made, arguments, PASS/FAIL, credits. Total: ~N credits.>

**Regenerate this runbook same-day before the call — data drifts between syncs.**
```

## Honesty rules

- Expected outputs are pre-flight snapshots, verbatim — never embellished,
  never projected. If the live call differs slightly, the AE narrates the
  delta as freshness ("the corpus synced since this morning").
- Substitutions are always visible to the AE and always have a prepared
  honest line; "never overclaim coverage" is the hard rule.
- Rate benchmarks are corpus-level for a vertical/band — the talk track says
  "market band", never "this creator's rate".
- A runbook older than today is expired. Refuse to hand over a stale one;
  offer to regenerate (~2 min, ~15–25 credits).

## Credit footprint

Standard pre-flight: ~12–15 credits (1 market 5 + 1 search 2 + 3 profiles 3,
plus 5 if rate mode validated). With substitution re-runs: up to ~25–30.
With staged Brief-to-Shortlist closer: +5–7. Internal credits — log the
tally in the runbook's pre-flight log, but no thrifty mode: a half-validated
demo defeats the purpose.
