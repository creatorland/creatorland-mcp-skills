---
name: wrap-report-skeleton
description: Scaffold a post-campaign wrap deck from a finished campaign's creator roster — re-profile each creator (current freshness, affiliations), pull the vertical benchmark for "you paid X vs market median Y" framing, and emit a wrap-deck skeleton with labeled placeholder slots for the customer's own performance metrics. Use when the user says "wrap report", "campaign wrap", "post-campaign deck", "wrap deck for [campaign]", or a campaign just ended and reporting is due.
---

# Wrap Report Skeleton

Campaigns end in a wrap deck; agencies are paid in decks. This skill takes the
finished campaign's creator roster + what was actually paid, refreshes each
creator's data, frames spend against the market band, and scaffolds the wrap
deck — with honest, labeled placeholders where the customer's own performance
metrics slot in (the MCP has no campaign-performance data, and the skeleton
never pretends otherwise). For agency account leads and brand-side managers.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

## Inputs to collect

- **Campaign roster** (required) — the creators who ran, in any format
  (handles, a sheet, a prior shortlist from this session). Map each row to one
  identifier type.
- **What was paid** (required for the benchmark framing) — per-creator fees
  or a total + rough split; "undisclosed" rows simply skip the per-creator
  framing line.
- **Campaign vertical + deal type** — infer from context if a brief or
  shortlist exists in-session; otherwise ask once.
- **Customer's performance numbers** (optional, can come later) — if supplied
  now, they fill the placeholder slots; if not, slots stay labeled.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

1. **Re-profile the roster** — for each roster creator:
   `get_creator_profile` `{ "identifier": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>" } }`
   (exactly one identifier type per call, whichever the roster provides).
   Capture CURRENT follower count, audience geo, freshness, and brand
   affiliations (pro) — the wrap deck shows where each creator is NOW vs.
   campaign start, and flags any new competitor affiliations acquired since.
   1 credit × N. **Credit estimate fires here when N + benchmark calls exceed
   ~30 credits** (a 25-creator roster does): state the estimate and offer
   thrifty before fanning out. Thrifty: profile only the top-spend creators
   (those covering ~80% of budget) and say how many were skipped.

2. **Freshness Gate** — classify each re-profiled creator. In a wrap context
   stale means "current-state claims (follower count, affiliations) may have
   drifted" — flag those rows rather than excluding (the creator already ran;
   exclusion makes no sense post-campaign).

3. **Benchmark the spend** — one `query_market_intelligence` per distinct
   vertical/deal-type in the campaign (usually one):
   `{ "mode": "rate", "vertical": "<campaign vertical>", "deal_type": "<if known>", "creator_tier": "<the ran creators' tier, if they share one>" }`
   — wrapped in Refusal Recovery (thorough: full ladder; thrifty: max 2
   rungs), clearance level disclosed. When the creators who ran share a tier,
   pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
   so the spend is benchmarked against same-size creators; when tiers are mixed
   keep the vertical-wide band as the fallback and say so (a too-thin tier
   auto-broadens, disclosed). This powers "you paid $X vs market
   median $Y" — corpus band vs actual spend, the wrap deck's most defensible
   slide. 5 credits per call incl. ladder retries. If a quoted per-creator
   fee should be positioned precisely, add `"quoted_rate": <USD>` on a
   dedicated call (thorough mode only, and only when the user asks for
   per-fee positioning).

4. **Scaffold the deck** (no tool calls) — assemble the skeleton below.
   Performance sections are placeholder slots unless the customer supplied
   numbers; never fill them from the corpus, memory, or the web.

## Deliverable

A wrap-deck skeleton in markdown (slide-per-section, paste-into-deck):

```markdown
# Campaign Wrap — <campaign/brand name>
_<flight dates> · <N> creators · scaffolded with Creatorland Data, <date>_

## Slide: Campaign summary
❏ Objectives (from your brief) · ❏ flight dates · ❏ total spend: $<total>

## Slide: The roster, then and now
| Creator | Platform | Followers (current) | Audience geo (top) | Freshness | New affiliations since campaign |
|---|---|---|---|---|---|
| @<handle> | <p> | <n> | <geo %> | fresh/aging/⚠ stale | none found in corpus / ⚠ <brand> |
<one row per creator; stale rows carry the drift caveat inline>

## Slide: Spend vs market
Market band for the **<vertical>** vertical<scope note if broadened>:
p25 $<x> · median $<y> · p75 $<z>.
Your average per-creator spend: $<avg> — <below/at/above> the corpus median.
<per-creator framing lines where fees were supplied>
> <provenance line verbatim from the tool> · recency window: <window>
This compares your spend to the corpus-level market band for the
vertical/tier — it is not any creator's personal rate history.

## Slide: Performance                       [placeholder — your data]
❏ Impressions · ❏ engagement · ❏ CTR/conversions · ❏ EMV — supply from your
analytics tools. The Creatorland Data MCP has no campaign-performance data;
these slots are deliberately left labeled rather than estimated.

## Slide: Learnings & next campaign
❏ What worked (yours) · suggested data follow-ups: re-run lookalikes off the
top performer (`search_creators` lookalike mode) for the next flight.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K>
flagged — current-state figures may have drifted.
Benchmark basis: <clearance level; if broadened: "a privacy feature of the
data source, not missing data">.
Provenance: Creatorland Data MCP · <M> profiles + <R> rate benchmark(s) · <date>.
Credits used this run: ~<N> (<M> profiles ×1 + <R> market-intel ×5).
```

## Honesty rules

- **The skeleton never fakes performance.** No corpus source for campaign
  results exists — placeholder slots stay labeled, never estimated.
- **Spend-vs-band framing is corpus-level.** "Market median for the
  vertical", never "what these creators usually charge".
- **Drift is disclosed, not hidden.** Stale rows are flagged inline (they
  can't be excluded post-campaign).
- **New-affiliation flags are corpus-derived** — "none found in our corpus",
  never "no new deals".
- Disclose every Refusal Recovery broaden at the clearance level.
- **PII invariant (convention 7).** No contact info in the deck, regardless
  of source.

## Credit footprint

thorough: ~(N + 5–10) credits for an N-creator roster (N profiles + 1–2 rate
calls; e.g. 10 creators ≈ 15–20) · thrifty: ~(0.6N + 5) credits (top-spend
profiles only + 1 rate call, max 2 ladder rungs). Estimate stated up front
whenever the plan exceeds ~30 credits.
