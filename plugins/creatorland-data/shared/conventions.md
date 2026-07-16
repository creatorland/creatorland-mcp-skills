# Creatorland Data MCP — skill authoring conventions

Every skill in this plugin follows these rules. They exist so that any output a
customer pastes into a client deck is defensible, honestly framed, and
credit-predictable. Skills reference this file and the shared modules with
`${CLAUDE_PLUGIN_ROOT}/shared/<file>.md`.

## The tool surface (ground truth — match these exactly)

Server: `creatorland-data` (remote MCP, `https://data-mcp.creatorland.com/mcp`, OAuth).

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

> **Internal-only rollout (CRE-1046, not GA):** the first-party search filters
> (`has_first_party_insights`, `min_first_party_engagement_rate`,
> `audience_country_share`, `audience_age_bracket_share`, `audience_gender_share`)
> and the `verified_insights` marker are granted to the `internal` plan ONLY —
> do not advertise them to customers or instruct users to pass them yet.

### `get_creator_profile` — 1 credit
Input: `{ identifier: { type, ... } }` — exactly one of five types:
`social_handle`, `creatorland_user_id`, `source_user`, `email`, `phone`.
Returns profile incl. interests, hashtags, audience geo, **data freshness**,
and brand affiliations (available on every plan, including free).

### `query_market_intelligence` — 5 credits (pro)
`mode: "market"` (counts/distributions) or `"rate"` (fair-price range).
Filters: `vertical` (e.g. "Beauty"), `sub_category`, `company_type`,
`deal_type` (e.g. "affiliate"), `active_since` (ISO 8601).
Rate mode: `quoted_rate` (USD) positions a quote within the range.
Guardrails: min-N floors — market 5 brands/25 deals, rate 10 brands/50 deals.
Thin slices come back **refused or broadened** — see Refusal Recovery.

### `match_creators` — free (0 credits), all plans
Phase 1 of bulk match-and-enrich. Input: `identifiers` (a flat array of mixed
emails / phone numbers / social handles, auto-classified server-side; 25–50,000
per call). Returns counts only — `{ submitted, matched, unmatched, duplicates,
estimated_credits (= 3 × matched), balance, preview_token, expires_at }` — no
per-identifier map and no profile data. The `preview_token` (charge window ~15
min) freezes the matched set for a single-charge enrich. Bounded by a 25-item
minimum batch (anti-probing) and a per-customer daily limit.

### `enrich_matches` — 3 credits per matched creator, pro/pilot only
Phase 2. Input: `{ preview_token, confirmed_credit_amount, cursor?, format? }`
where `format` is `csv | json | jsonl`. `confirmed_credit_amount` MUST equal the
token's `estimated_credits` and MUST come from a human confirmation — it is the
spend gate, never auto-echoed. Charges once; partial-to-balance funds the
affordable prefix and reports `unfunded`; a funded set over ~200 rows
auto-delivers as a downloadable file via a ~24h signed URL, else inline pages of
~100 (`cursor` pages the already-charged set for free). Entitlement
`BULK_MATCH_ENRICH`; non-entitled plans get a refused upgrade envelope. The
two-step, human-confirms-the-spend flow is documented in the `bulk-match-enrich`
skill.

### `get_audience_report` — 25 credits (pro), premium
Verified third-party AUDIENCE report for one creator. Input:
`{ platform: instagram|tiktok|youtube, handle? , source_user_id?, force_refresh? }`
(supply `handle` OR `source_user_id`; prefer the stable `source_user_id` for a
guaranteed cache hit). Cache-first: a fresh-enough report (within 30 days)
re-serves at $0 vendor cost but bills the same 25 credits (the pooled cache is
the moat); `force_refresh` forces a fresh paid pull. Output stamps
`as_of {profile_updated}` and a coverage block. **Instagram-first coverage:**
credibility / fake-follower % (suspicious/bot only) / mass-follower % (real but
low-value) / audience brand-affinity are Instagram-only today;
TikTok / YouTube return demographics + geo only. Pro entitlement
`audience_reports`; gated behind a go-live master flag (refuses cleanly until on).
Never returns or stores creator contact info (PII excluded structurally).

### `check_audience_coverage` — free (0 credits)
Cost preflight for audience reports. Input: `{ creators: [{ platform, handle?,
source_user_id? }] }` (1–100). Reads the pooled cache (no spend) and returns
`{ total, cached_free, needs_fresh, credits_per_report, estimated_credits,
summary, items[] }` — i.e. "N cached (free), M fresh (≈X credits)". A cache hit
needs the stable `source_user_id`; handle-only creators count as needs-fresh.
Call this BEFORE `get_audience_report` on any roster so the human sees + confirms
the spend.

### Server-side prompts (use them — they're maintained with the server)
`shortlist-from-brief`, `lookalike-search`, `fair-price-check`.

### Connection tools — brand→creator outreach (used ONLY by connection-enabled skills)
`request_creator_connection` (10 credits), `get_connection_status` (free),
`list_connections` (free). Entitlement-gated behind `creator_connections`
(pro + pilot); non-entitled plans get a successful refused envelope. Full
contract — schemas, mandatory pre-flight (credit estimate + confirm +
suppression pre-screen), graceful degradation, and privacy invariants — lives in
`${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md`. The read-only catalog does NOT
use these tools; outreach is an additive skill layer.

## Credit price index ($25 / 1,000-credit pack → $0.025/credit)

| Action | Credits |
|---|---:|
| `get_creator_profile` | 1 |
| `search_creators` | 2 |
| `match_creators` (bulk match, free) | 0 |
| `enrich_matches` | 3 per matched creator |
| `get_audience_report` (premium, pro) | 25 (cache hit = same, pure margin) |
| `check_audience_coverage` (cost preflight) | free |
| `get_member_content_stats` | 1 |
| `query_market_intelligence` | 5 |
| profile fan-out of N | 1×N |
| `request_creator_connection` | 10 (one charge per creator, whole sequence) |
| `get_connection_status` / `list_connections` | free |
| reaching N creators | 10×N |

Pro = $199/mo, 2,000 credits/mo (metered — credit packs cover overage). Free tier = all read tools, 250 credits/mo (then an upgrade wall).

Credit packs are **volume-tiered**, not a single flat pack: base $25 / 1,000 = $0.025/credit, dropping to ≈$0.02/credit at 10+ packs (~20% off). Higher-volume tiers exist; the base per-credit figure above still anchors estimates.

## The conventions

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
   (live now — Creatorland's matchmaker reaches the creator for you via the
   connection tools; the creator's address is still never returned or shown) or
   the creator's public profiles.
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
10. **Budget is a PRICE, never an audience-size filter (CRE-649).** A figure
    the user gives as spend — "$3–5K per video", "we have $20K", "mid
    four-figures a post" — is a RATE, not a follower count. NEVER derive
    `min_followers` / `max_followers` from a budget, and never disqualify a
    creator for being "too small" (or "too big") for a budget the user stated
    as spend. Map budget → rate instead: surface the market rate band up front
    (one `query_market_intelligence` rate call for the slate's vertical,
    Refusal Recovery as always) and flag which candidates sit inside the
    stated budget band, or simply attach the band as context. Set follower
    filters ONLY from an explicit audience-size ask ("50–200K followers") or a
    named tier (macro/mid/micro) — never from money. When the user gives both
    a budget and a tier, the tier sets the follower filter and the budget sets
    the rate band; they are different axes.
11. **Use brand filters when the user names brands (CRE-649).** When the user
    names brands to match on — "creators who've worked with similar beauty
    brands, I'm at Fenty" — build an explicit comp set from the named brand
    and its peers (Fenty → Rare Beauty, Pat McGrath, Glossier, Charlotte
    Tilbury, …) and pass it as a `brand_affinities` filter on `search_creators`
    (and confirm via each profile's **brand affiliations** in the fan-out),
    rather than leaving brand fit to semantic match on the `brief` text.
    Show the comp set back so the user can correct it.
12. **Relax the BINDING constraint, sensibly — never the satisfied one
    (CRE-649).** When results are thin, loosen the constraint that is actually
    limiting the pool, and never propose a change that contradicts what the
    user asked for:
    - **Geo:** if the user named a region (e.g. "California"), do NOT suggest
      "widen to LA / SF / SD" — those ARE inside California, so a thin result
      is a *coverage* symptom, not an over-tight filter. Broaden geo at the
      SAME level the user used (California → West Coast / US), state coverage
      limits honestly ("our corpus is light on creators tagged to California
      right now"), and offer **audience-geo** as an alternative axis (creators
      whose *audience* skews to the region, even if the creator isn't based
      there).
    - **Platform:** if the user requested a platform (IG Reels), do NOT propose
      switching it off (don't offer TikTok when they asked for Instagram).
      Relax tier, recency, niche-tightness, or engagement-rate floors first;
      keep the requested platform fixed unless the user opens it.
    - **Order of relaxation:** drop the narrowest non-requested filter first
      (engagement-rate floor → niche tightness → follower-tier width → geo
      level), never a constraint the user explicitly stated, and say which
      constraint you relaxed and why.
13. **Auto-chain confirming profile lookups (CRE-649).** When the ask requires
    confirming a fact about specific finalists — affiliations, audience geo,
    appropriate pricing — call `get_creator_profile` on the top 2–3
    automatically to fulfil the ask. Do NOT stop and offer to look them up;
    the lookup IS the job. (The full profile fan-out already covers this in
    the shortlist skills; this convention makes it explicit for lighter,
    fewer-candidate asks too.)
