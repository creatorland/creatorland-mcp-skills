---
name: campaign-monitor
description: For a LIVE campaign whose rostered creators are Creatorland members with OAuth'd socials, monitor account-level content performance via the consented stats tool and build a living dashboard from it. Use when the user says "monitor this campaign", "campaign dashboard", "track our creators' performance", "how are our campaign creators doing", or hands over a live roster to watch. Handles roster intake, per-creator consent status (honest "not a member / not OAuth'd" slots), benchmark framing, and scheduled refresh. Deliverable is a per-creator performance dashboard with a consent-coverage summary. For a post-campaign wrap deck use wrap-report-skeleton; to cast a brief use brief-to-shortlist.
---

# Campaign Monitor

A live campaign needs a living dashboard. This skill takes the campaign's
rostered creators, pulls each one's OAuth-consented, account-level stats via
`get_member_content_stats`, frames the numbers against the vertical's market
band, and assembles a per-creator dashboard — with honest, labeled slots for
creators who aren't members or haven't connected socials, so coverage is
visible rather than hidden. It is the in-flight monitoring artifact; for the
post-campaign wrap deck use `wrap-report-skeleton`. For agency account leads
and brand-side managers running a campaign right now.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

## The new tool this skill wraps

`get_member_content_stats` — **1 credit per call** (per-row, like a profile
fan-out). Newly live as of CRE-541; not yet in `shared/conventions.md`, so its
shape is documented here:

- **Input:** `{ identifier: { type, ... } }` — exactly one of the same five
  identifier types as `get_creator_profile`: `social_handle`,
  `creatorland_user_id`, `source_user`, `email`, `phone`.
- **Success envelope (connected):** `consented: true`, `providers[]`, plus
  `accounts[]` where each account carries `provider`, `username`,
  `is_verified`, `followers`, `subscriber_count`, `view_count`,
  `likes_count`, `video_count`, `media_count`, `engagement_signal`
  (likes/views, or `null`), `source_updated_at`; plus a top-level
  `data_as_of` and `freshness`.
- **Refused / not-connected envelope (this is a SUCCESS, not an error):** the
  tool returns a clean refused/not-connected envelope — never an exception —
  for (a) a creator who isn't a Creatorland member, (b) a member with no
  connected/OAuth'd socials, or (c) a plan without the entitlement. Treat each
  of these as a labeled dashboard slot, not a failure.
- **Scope ceiling (hard):** this tool is **account-level only**. It returns
  per-provider account totals. **Per-post / per-video engagement and audience
  demographics do NOT exist yet** (deferred to CRE-653). This skill must never
  fabricate per-post metrics, per-deliverable performance, or audience
  breakdowns — if asked, say they're not available yet and point to the
  account-level figures that are.

## Inputs to collect

- **Campaign roster** (required) — the creators on the live campaign, in any
  format (handles, emails, a CSV, or a prior shortlist/slate from this
  session). Map each row to one of the five identifier types (a handle column
  → `social_handle`, an email column → `email`, a Creatorland ID →
  `creatorland_user_id`, etc.). If rows mix types, map each row to its own
  type. Ask which column is the identifier only if ambiguous.
- **Campaign vertical** (required for the benchmark band) — infer from an
  in-session brief/shortlist if one exists; otherwise ask once. Sets the
  `query_market_intelligence` filter.
- **Deal type** (optional) — sharpens the benchmark band if the corpus
  supports it.
- **Refresh cadence** (optional) — if the user wants this to be a standing
  dashboard, note the cadence so the schedule tip fires (see Flow step 5).
- **Mode** — default `thorough`; `thrifty` on the standard triggers.

Never re-ask for identifiers or a vertical the conversation already holds.

## Flow

**Step 0 — Count rows and estimate (mandatory over ~30 credits).** The stats
fan-out is **1 credit per roster row**, plus ~5 per benchmark call, so the
pre-run credit estimate is mandatory once the roster pushes the plan past ~30
credits (and stated regardless once N×1 + benchmark > 30):

> Estimated cost: ~<N+5> credits (~$<(N+5)×0.025>) — <N> content-stats calls
> (1 each) + 1 market-intel benchmark (5). Say "thrifty" to monitor only the
> connected creators you name, or cap the row count.

State it, then proceed (do not block). **Thrifty:** pull stats only for a
user-named priority subset (and still surface the un-pulled rows in the
coverage summary so they aren't hidden), and take at most 2 refusal-ladder
rungs on the benchmark.

**Step 1 — Per-creator stats fan-out** — for each roster row:
`get_member_content_stats` `{ "identifier": { "type": "<row's type>", ... } }`
(exactly one identifier type per call, matching that row). Classify the
envelope into one of three **consent slots** — this is the heart of the
skill:

- **🟢 Connected** — `consented: true` with `accounts[]`. Capture per provider:
  `followers` / `subscriber_count`, `view_count`, `likes_count`,
  `video_count` / `media_count`, `engagement_signal`, `is_verified`, and
  `source_updated_at`. These rows carry real numbers.
- **🟡 Member, no connected socials** — refused/not-connected envelope for a
  member who hasn't OAuth'd any socials. Labeled slot: "member, no socials
  connected — no consented stats to show." Never an error, never blank-
  implying-zero.
- **⚪ Not a Creatorland member** — refused envelope for a non-member. Labeled
  slot: "not a Creatorland member — outside the consented-stats surface."

A plan-without-entitlement envelope is labeled "stats unavailable on plan",
not blank. 1 credit per call regardless of which slot it lands in.

**Step 2 — Freshness Gate** — classify each **connected** row from its
`freshness` / `source_updated_at`: fresh / aging / stale. Stale rows keep
their numbers but carry the "figures may have drifted — re-verify" caveat
inline (you can't exclude a live-campaign creator; you flag the drift). The
🟡/⚪ slots are not freshness-gated — they have no figures to age.

**Step 3 — Benchmark framing** — one `query_market_intelligence` per distinct
campaign vertical (usually one), **wrapped in Refusal Recovery** (market-mode
floor 5 brands / 25 deals; rate-mode floor 10 brands / 50 deals):
`{ "mode": "market", "vertical": "<campaign vertical>" }` for the activity/
engagement context band, and in thorough mode also
`{ "mode": "rate", "vertical": "<vertical>", "deal_type": "<if known>", "creator_tier": "<the monitored roster's tier, if it shares one>" }`.
When the connected roster shares a creator tier, pass `creator_tier`
(emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) so the band is size-scoped;
when tiers are mixed keep the vertical-wide band as the fallback (a too-thin
tier auto-broadens, disclosed). This gives each creator's account-level numbers a "vs market" band so a
follower or engagement figure reads against the vertical norm, not in a
vacuum. Walk the ladder on refusal, stop at first clearance, and **disclose
the clearance level** in the footer ("a privacy feature of the data source,
not missing data"). 5 credits per call incl. retries. Thrifty: max 2 rungs;
market-band call only.

**Step 4 — Assemble the dashboard** (no tool calls) — build the artifact
below: per-creator rows for connected creators, the labeled 🟡/⚪ slots,
roster totals across connected accounts, a consent-coverage summary, and the
benchmark band. Emit it as a harness-side dashboard artifact/canvas where the
harness supports one (the way the deck/dashboard skills do — a single
markdown document the user can keep open and re-render); otherwise inline
markdown. Re-running the skill overwrites the same artifact so it reads as a
living dashboard, not a new file each time.

**Step 5 — Scheduled refresh (make it living)** —

> Tip: in a harness with scheduled tasks (e.g. Cowork scheduled tasks),
> schedule "refresh the campaign-monitor dashboard for '<campaign name>'"
> daily or weekly. Each run re-fans-out the stats, re-pulls the benchmark,
> and overwrites the same dashboard artifact, so it stays current for the
> length of the flight. On-demand runs are the baseline; never depend on
> scheduling existing.

## Deliverable

A campaign performance dashboard in markdown (single artifact, re-renderable):

```markdown
# Campaign Monitor — <campaign / brand name>
_Live dashboard · <N> rostered creators · data as of <data_as_of> · <date>_

## Consent coverage
🟢 <c> connected · 🟡 <m> member, no socials · ⚪ <u> not a member
<c>/<N> creators reporting consented stats. Un-reporting slots are shown
below, not hidden — coverage is a campaign fact, not an error.

## Connected creators (account-level, consented)
| Creator | Provider | Followers/Subs | Views | Likes | Videos/Media | Engagement signal | Verified | Freshness |
|---|---|---|---|---|---|---|---|---|
| @<handle> | instagram | <n> | <view_count> | <likes_count> | <count> | <likes/views or —> | ✓/— | fresh/aging/⚠ stale |
<one row per connected account; a multi-platform creator gets one row per provider>

## Not reporting (labeled, never blank)
| Creator | Status |
|---|---|
| @<handle> | 🟡 member, no socials connected — no consented stats |
| @<handle> | ⚪ not a Creatorland member — outside the consented-stats surface |
<or "All rostered creators are connected.">

## Roster totals (connected accounts only)
Followers/subs across connected accounts: <Σ> · views: <Σ> · likes: <Σ>.
<Totals cover the <c> connected creators only — the 🟡/⚪ slots contribute
no figures by design.>

## Benchmark band (vs market)
Market context for the **<vertical>** vertical<scope note if broadened>:
<activity / engagement band from market mode; rate band p25 $<x> · median
$<y> · p75 $<z> if pulled>. Read each creator's account-level numbers
against this corpus band — it is the vertical norm, not any creator's
personal history.
> <provenance line verbatim from the tool> · recency window: <window>

## Not available yet
Per-post / per-video engagement and audience demographics are **not exposed
yet** (CRE-653). This dashboard is account-level only; these slots are left
out deliberately rather than estimated.

---
Consent coverage: <c>/<N> connected; <m> member-no-socials; <u> non-member.
Data freshness: <F>/<c> connected creators synced within the last sync
window; <K> flagged — account figures may have drifted.
Benchmark basis: <clearance level; if broadened: "a privacy feature of the
data source, not missing data">.
Provenance: Creatorland Data MCP · <c> content-stats calls + <R> market-intel · <date>.
Credits used this run: ~<N+5R> (<N> content-stats ×1 + <R> market-intel ×5).
```

## Honesty rules

- **Account-level only — never fake per-post.** `get_member_content_stats`
  returns per-provider account totals; per-post / per-video engagement and
  audience demographics do not exist yet (CRE-653). Never estimate, infer, or
  imply them — the "Not available yet" block says so explicitly.
- **Un-consented slots are visible, not hidden.** The refused/not-connected
  envelope is a SUCCESS; every 🟡/⚪ creator appears as a labeled slot. An
  honest dashboard shows its own coverage holes — that is the feature.
- **Consent is the data source.** Stats are first-party, OAuth-consented,
  per-provider — never scraped, never inferred from a public profile. Say so.
- **Freshness is disclosed per connected row** from `source_updated_at` /
  `freshness`; stale rows keep numbers but carry the drift caveat (live
  creators can't be excluded).
- **Benchmark is corpus-level for the vertical** — "market band for the
  vertical", never "what these creators normally do" (convention 2). Disclose
  every Refusal Recovery broaden at the clearance level.
- **Plan honesty.** A no-entitlement envelope is labeled "stats unavailable
  on plan", never blank-implying-zero.
- **PII invariant (convention 7).** No contact info in the dashboard,
  regardless of source — including any contact data in the uploaded roster.
  The tool returns none; you add none.

## Cross-references

- **Casting the campaign** (building the roster in the first place) →
  `brief-to-shortlist`.
- **Post-campaign wrap deck** (flight is over, reporting is due) →
  `wrap-report-skeleton`.
- **Enriching the roster with profile data** (interests, geo, affiliations) →
  `roster-enricher`.
- **Benchmarking the roster's rates** rather than performance →
  `rate-card-generator`.

## Credit footprint

thorough: ~(N + 5–10) credits for an N-creator roster (N content-stats ×1 + 1–2
market-intel ×5; e.g. 15 creators ≈ 20–25) · thrifty: ~(subset + 5) credits
(named-subset content-stats only + 1 market-band call, max 2 ladder rungs),
with un-pulled rows still shown in the coverage summary. Estimate stated up
front whenever the plan exceeds ~30 credits.
