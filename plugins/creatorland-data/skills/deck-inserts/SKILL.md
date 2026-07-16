---
name: deck-inserts
description: Format any Creatorland market or rate aggregate as a citation-ready deck insert — stat plus the verbatim provenance line plus the recency window — so a number you paste into a client deck is defensible by construction. Use when the user says "make this deck-ready", "citation-ready stat", "deck insert", "provenance block for this number", or wants a market/rate figure formatted for a client-facing deck. Compliance as a feature; produces ready-to-paste insert blocks.
---

# Provenance-First Deck Inserts

Agencies paste numbers into client decks, and an uncited number is a liability.
This skill takes a market or rate aggregate — either one you ask it to pull, or
one already returned earlier this session — and emits it as a citation-ready
insert: the stat, the verbatim provenance line the tool returned, and the
recency window. Defensible by construction. The deliverable is one or more
paste-ready insert blocks. For anyone building a client-facing deck.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions — especially #1 provenance-first). This skill
honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md).

> This is the formatting/compliance skill, not a discovery skill. If the user
> wants creators found, that's `brief-to-shortlist`. If they want a full
> negotiation memo, that's `fair-price-brief`. This skill turns aggregates
> into citation-ready slide blocks.

## Inputs to collect

- **The stat(s) wanted** (required) — either a description of the figure
  ("median rate for beauty affiliate deals", "deal volume in fitness this
  year") or a number already produced earlier this session that needs
  formatting.
- **Slice** — vertical, sub_category, deal_type, company_type, active_since —
  whatever the user specifies; passed straight to the tool.
- **Reuse vs re-pull** — if the exact aggregate is already in this session's
  context, reuse it (0 credits) and just format it; only call the tool when
  the number isn't already on hand. Ask nothing twice.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

1. **Source the aggregate.** If the figure already exists in session context
   (from an earlier skill run), **reuse it — no tool call, 0 credits** — and
   skip to step 3. Otherwise pull it:
   - Counts/distributions → `query_market_intelligence`
     `{ "mode": "market", "vertical": "<v>", "sub_category": "<if any>", "deal_type": "<if any>", "company_type": "<if any>", "active_since": "<ISO if any>" }`
   - Rate band → `query_market_intelligence`
     `{ "mode": "rate", "vertical": "<v>", "deal_type": "<if any>", "creator_tier": "<if the requested stat is tier-specific>" }`
   **Wrapped in Refusal Recovery** (market floor 5 brands / 25 deals; rate
   floor 10 brands / 50 deals). If the requested figure is tier-specific (e.g.
   "median rate for micro beauty creators"), pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
   so the stat scopes to that follower tier; a tier too thin for the floor
   broadens (disclosed) to the all-tier band. Walk the ladder (thorough: to
   clearance; thrifty: max 2 rungs) and capture the clearance level — it becomes the
   benchmark-basis line in the insert. 5 credits per call incl. retries.

2. **Capture the provenance verbatim.** Take the provenance line and recency
   window EXACTLY as the tool returned them. Do not paraphrase, round away, or
   prettify — convention 1 forbids stripping provenance to look cleaner.

3. **Emit the insert block(s)** (no tool calls) — one self-contained,
   paste-ready block per stat, each carrying its own citation so it stays
   defensible no matter which slide it lands on.

## Deliverable

One or more citation-ready insert blocks, each standalone:

```markdown
> ## <Stat headline — e.g. "Median beauty-affiliate creator fee: $X">
> **<the figure / band — e.g. "p25 $a · median $b · p75 $c">**
>
> Source: Creatorland Data — <benchmark scope at which the floor cleared>.
> <provenance line verbatim from the tool>
> Recency window: <window as returned>.
> _Corpus-level market band for the vertical/tier — not any individual
> creator's rate._
> <If broadened: "Scope note: the narrower slice was below the privacy floor
> (<floor>), so it was widened — a privacy feature of the data source, not
> missing data.">
```

Provide one block per requested stat. Close with:

```markdown
---
Provenance: Creatorland Data MCP · <K reused, J freshly pulled> aggregate(s) · <date>.
Credits used this run: ~<N> (<J> market-intel ×5; <K> reused at 0).
```

## Honesty rules

- **Never strip provenance to make a slide prettier (convention 1).** The
  verbatim provenance line and recency window are the point — they ride with
  the stat into the deck.
- **Aggregates are corpus-level.** Rate figures are vertical/tier bands, never
  a creator's rate; the italic line is mandatory on rate inserts.
- **Disclose every broaden.** If Refusal Recovery widened the slice, the scope
  note states the clearance level — never present a broadened number as if it
  answered the narrow question.
- **Reuse honestly.** When reusing a session figure, it must be the same
  slice the user is asking to cite — don't relabel an old number for a new
  question.
- **PII invariant (convention 7).** Inserts carry aggregates only — no creator
  contact info, regardless of source.

## Credit footprint

thorough: ~5–10 credits per freshly pulled stat (1 market-intel call + ladder
rungs at 5 each); 0 credits for stats reused from session context · thrifty:
~5 credits per stat (max 2 ladder rungs), reuse-first.
