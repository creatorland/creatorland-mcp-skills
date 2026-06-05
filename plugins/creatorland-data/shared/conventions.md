# Creatorland Data MCP — skill authoring conventions

Every skill in this plugin follows these rules. They exist so that any output a
customer pastes into a client deck is defensible, honestly framed, and
credit-predictable. Skills reference this file and the shared modules with
`${CLAUDE_PLUGIN_ROOT}/shared/<file>.md`.

## The tool surface (ground truth — match these exactly)

Server: `creatorland-data` (remote MCP, `https://mcp-server-609509006565.us-central1.run.app/mcp`, OAuth).

### `search_creators` — 2 credits
Discriminated on `mode`:
- **`mode: "brief"`** — `brief` (free text, ≤2000 chars) and/or `filters`
  (at least one signal required). `filters`: `platform`
  (`instagram|tiktok|youtube|twitter|twitch`), `niche`, `country`, `city`,
  `min_followers`, `max_followers`, `interests[]`, `hashtags[]`,
  `brand_affinities[]`, `is_verified`, `min_engagement_rate` (0–1).
  `limit` 1–150 (default 25), `precision` `broad|balanced|tight`.
- **`mode: "lookalike"`** — exactly one of `seed_creator` (an identifier, see
  below) or `seed_content` (`{url}` or `{source_post_id[, source_collection]}`).
  Same `limit`/`precision`. Inference-free (uses stored embeddings).

### `get_creator_profile` — 1 credit
Input: `{ identifier: { type, ... } }` — exactly one of five types:
`social_handle`, `creatorland_user_id`, `source_user`, `email`, `phone`.
Returns profile incl. interests, hashtags, audience geo, **data freshness**,
and (pro plan) brand affiliations.

### `query_market_intelligence` — 5 credits (pro)
`mode: "market"` (counts/distributions) or `"rate"` (fair-price range).
Filters: `vertical` (e.g. "Beauty"), `sub_category`, `company_type`,
`deal_type` (e.g. "affiliate"), `active_since` (ISO 8601).
Rate mode: `quoted_rate` (USD) positions a quote within the range.
Guardrails: min-N floors — market 5 brands/25 deals, rate 10 brands/50 deals.
Thin slices come back **refused or broadened** — see Refusal Recovery.

### Server-side prompts (use them — they're maintained with the server)
`shortlist-from-brief`, `lookalike-search`, `fair-price-check`.

## Credit price index ($25 / 1,000-credit pack → $0.025/credit)

| Action | Credits |
|---|---:|
| `get_creator_profile` | 1 |
| `search_creators` | 2 |
| `query_market_intelligence` | 5 |
| profile fan-out of N | 1×N |

Pro = $199/mo, 5,000 credits. Free tier = discovery only, small grant.

## The nine conventions

1. **Provenance-first output.** Every aggregate you emit is a citation-ready
   block: the stat + the provenance line the tool returned + the recency
   window. Never strip provenance to make output prettier.
2. **Honest rate framing.** Benchmarks are corpus-level for a vertical/band.
   Write "market band for this vertical/tier", NEVER "this creator's rate".
   When Refusal Recovery broadened the query, say at what level the floor
   cleared ("benchmark holds at the Beauty vertical level, not for skincare
   specifically").
3. **Refusal Recovery on every market-intel call.** Wrap per
   `${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md`. A refusal is a guided
   staircase, not a dead end.
4. **Freshness Gate before client-facing lists.** Per
   `${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md` — stale records flagged or
   excluded, with a "re-verify before pitch" list.
5. **Credit modes.** Honor `thrifty`/`thorough` per
   `${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md`; estimate cost up front when
   a run will exceed ~30 credits and say so before fanning out.
6. **End in a deliverable, not a chat answer.** Each skill defines its output
   artifact (markdown shortlist, one-page memo, runbook). Produce the artifact.
7. **PII discipline — the deliverable invariant (CRE-582).** No contact
   information appears in ANY deliverable, **regardless of source**. The MCP
   never returns contact info — but your session may have other data sources
   (other MCPs, uploaded files, web results) that do; the invariant still
   holds. Scrub bio snippets of emails, phone numbers, and contact links.
   Never imply you have contact info or speculate about it. The contact
   affordance is a "Creatorland Member" flag + "Contact via Creatorland"
   (connections coming soon) or the creator's public profiles.
8. **Thin-niche honesty for discovery (CRE-587).** When a target's exact
   niche is thin in-corpus, never pad the list with weak fits silently.
   Disclose, then broaden exactly one labeled step at a time — exact niche →
   adjacent niches → vertical — and mark every pick as in-corpus exact fit
   vs adjacent fit ("3 exact matches; 5 adjacent — expedition/outdoor
   divers"). Downgrade any fit-confidence labels accordingly.
9. **Multi-target briefs become slates.** A client target LIST (N archetypes)
   gets one search per target and a per-target-sectioned deliverable with an
   overview (brief restatement, methodology, per-target caveats) — never one
   merged generic search.
