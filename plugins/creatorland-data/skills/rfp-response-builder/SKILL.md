---
name: rfp-response-builder
description: Assemble the creator-strategy section of an RFP response from the RFP's audience and market requirements — market sizing from corpus aggregates, an example talent slate per target market via brief-mode searches, and indicative rate bands with provenance citations. Use when the user says "respond to this RFP", "build the RFP creator section", "RFP talent strategy", or pastes an RFP with multi-market creator requirements. Heavy multi-call; produces a cited, per-market strategy document.
---

# RFP Response Builder

Holding-company and agency strategy leads answer RFPs, and the creator-strategy
section needs to look institutional: market sizing, example slates per market,
indicative rate bands — all cited. This skill reads an RFP's requirements,
treats each target market/archetype as its own search (convention 9: a target
list becomes a slate, never one merged search), and assembles a per-market,
citation-ready strategy section. Heavy multi-call — the credit estimate always
fires.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> If the RFP is really a single written brief for one market, `brief-to-shortlist`
> is lighter. This skill is for multi-market / multi-archetype RFPs that need
> market sizing + cited bands as a formal response section.

> **Precision & filters for outreach (convention 14).** When this list will
> feed an outreach step, default to precision over raw recall: search
> `precision: "tight"` with the hard-gate filters the brief supports
> (`platform`, `niche`, `data_freshness_days`, `content_format`,
> `audience_country`), and reserve `broad` plus heavy `lookalike` unioning for
> market sizing. Do not fan out dozens of `lookalike` calls to hit a volume
> target (each hop drifts from the seed), and trim the weak tail by each
> result row `relative_fit` (within-set fit, `1.0` = strongest) rather than
> padding to a round number. Canon:
> `${CLAUDE_PLUGIN_ROOT}/shared/conventions.md` convention 14.

## Inputs to collect

- **The RFP** (required) — pasted text or excerpt. Normalize it yourself; do
  not make the user restructure it.
- **Target markets / archetypes** — extract the LIST from the RFP (e.g. "US +
  UK + DE beauty mid-tier", "3 creator archetypes"). Confirm the list back in
  one block. This list defines the per-target sections.
- **Example-slate size per market** — default **5**; honor "a few"/"top 10".
- **Deal types / compensation model** if the RFP specifies one.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

**Step 0 — Normalize + enumerate targets (no tool call).** Produce the target
matrix: market × archetype × tier, with the RFP's own requirement language per
cell. Show it; proceed unless corrected. **Convention 9: one search per
target — never one merged generic search.**

**Pre-run estimate fires here, always** (this skill is multi-call by nature).
For T targets at slate size S, thorough ≈ T×(2 search + S profiles) +
T market-intel calls. Example: 3 markets × (2 + 5) + 3×5 = 36 credits. State
it and offer thrifty before fanning out.

**Step 1 — Market sizing per target** — `query_market_intelligence`
`{ "mode": "market", "vertical": "<target vertical>", "sub_category": "<if RFP specifies>", "company_type": "<if relevant>" }`
— wrapped in Refusal Recovery (market floor 5 brands / 25 deals; thorough:
full ladder; thrifty: max 2 rungs). Gives deal volume / distribution to size
the opportunity per market. Disclose clearance level. 5 credits each incl.
ladder retries.

**Step 2 — Example slate per target** — one search per target:
`search_creators { "mode": "brief", "brief": "<normalized per-target requirement text, ≤2000 chars>", "filters": { "country": "<market>", "platform": "<if stated>", "min_followers": <tier floor>, "max_followers": <tier ceiling>, "niche": "<if clean>" }, "limit": <2×slate size>, "precision": "balanced" }`
2 credits per target. **Thin-niche honesty (convention 8):** if a target's
niche is thin in-corpus, disclose and broaden exactly one labeled step at a
time (exact niche → adjacent → vertical), marking each pick exact vs adjacent
fit. **Cross-market gaps (RFP constraint):** a market where even the broadened
search returns thin is flagged "needs local sourcing" — never padded.

**Step 3 — Profile the slate (thorough)** — `get_creator_profile` per
finalist `{ "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id>" } }`
(or whichever single type the search returned) → audience-geo confirmation +
freshness. Thorough: profile each target's slate cut. Thrifty: skip profiling,
present slates on search signal only and say so. 1 credit each.

**Step 4 — Freshness Gate** per profiled creator; stale → "re-verify before
pitch" per market.

**Step 5 — Indicative rate band per target** — reuse the rate dimension:
`query_market_intelligence { "mode": "rate", "vertical": "<target vertical>", "deal_type": "<if specified>", "creator_tier": "<the target's slate tier, if it clusters at one>" }`
wrapped in Refusal Recovery (rate floor 10 brands / 50 deals). One band per
distinct vertical/market — cited. When the target's example slate clusters at a
creator tier, pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
for a size-scoped band; when tier is mixed or unknown keep the vertical-level
band as the fallback and say so (a too-thin tier auto-broadens, disclosed).
5 credits each.

**Step 6 — Assemble** (no tool calls) the per-market strategy document.

## Deliverable

A per-market creator-strategy section in markdown, citation-ready:

```markdown
# Creator Strategy — <RFP / brand name> response
_Prepared with Creatorland Data · <date> · <T> target markets_

## Approach & methodology
Per the RFP we treated each target market/archetype as its own search.
Market sizing draws on the Creatorland deal corpus; example slates are
illustrative (not a committed roster); rate bands are corpus-level vertical
benchmarks. Privacy floors mean some narrow slices were widened — disclosed
inline per market.

## Market: <market 1> — <archetype/tier>
**Opportunity size:** <deal volume / distribution from market mode>
> <provenance line verbatim> · recency window: <window>
**Example talent slate** (illustrative, <S> creators):
- @<h> (<platform>, <followers>) — <fit note>; audience <geo %>; freshness
  <fresh/aging>; <exact fit | adjacent fit — niche>
<repeat per creator>
**Indicative rate band:** market band for **<vertical>** —
p25 $<x> · median $<y> · p75 $<z> (corpus-level, not per-creator).
> <provenance line verbatim>
**Coverage note:** <"exact-niche depth good" | "N exact + M adjacent" |
"⚠ thin in corpus — recommend local sourcing partner for this market">
**Benchmark basis:** <clearance level; if broadened: privacy-floor note>

## Market: <market 2> ...
<repeat the block per target>

## Cross-market summary
| Market | Corpus depth | Slate confidence | Rate band basis |
|---|---|---|---|
<one row per market — honest depth/confidence, gaps flagged>

## Caveats
- Slates are illustrative, not committed rosters.
- Rate bands are vertical-level corpus benchmarks — no per-creator rates exist.
- Conflict/affiliation screening available on request (pro plan) — see
  `conflict-check`.
- No creator contact info is included or available via this tool.

---
Data freshness: <N>/<M> profiled creators synced within the last sync window;
<K> flagged for re-verification.
Provenance: Creatorland Data MCP · <searches> + <profiles> + <market-intel
calls> · <date>.
Credits used this run: ~<N> (<breakdown by call type>).
```

## Honesty rules

- **Each target is its own search (convention 9).** Never merge archetypes
  into one generic search; the document is per-target sectioned.
- **Thin markets are flagged, never padded (conventions 8 + RFP constraint).**
  Disclose, broaden one labeled step at a time, mark exact vs adjacent fit;
  a market still thin after broadening is "needs local sourcing".
- **Slates are illustrative.** Never present them as committed rosters or
  imply availability.
- **Rate bands are vertical-level.** Cited corpus band, never per-creator rate.
- Disclose every Refusal Recovery broaden at the clearance level, per market.
- **PII invariant (convention 7).** No contact info, regardless of source.

## Credit footprint

thorough: ~(T×(2 + S) + 2T×5) credits — e.g. 3 markets × slate 5 ≈ 51 credits
(3 searches + 15 profiles + 3 market + 3 rate calls; +5 per ladder rung) ·
thrifty: ~(T×2 + T×5) credits — e.g. ~21 (searches + one market-or-rate band
per market, no profiling, max 2 ladder rungs). Estimate stated up front,
always.
