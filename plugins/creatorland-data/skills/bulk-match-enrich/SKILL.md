---
name: bulk-match-enrich
description: Take your OWN list of contacts (emails, phones, social handles from a CSV, Excel, or pasted list) and find which are creators in the Creatorland corpus, see the cost for free, confirm, then enrich every match. Use when the user says "match my list against your creators", "which of my contacts are creators", "bulk match and enrich", or "enrich this list of emails/handles". Match is free; enrichment is 3 credits per matched creator.
---

# Bulk Match-and-Enrich

The customer brings their OWN list of identifiers (emails, phone numbers, and/or
social handles, extracted from a CSV / Excel / pasted list) and wants to know
which of them are creators in our corpus and pull the full profile on every
match. This skill drives the deliberate two-step contract: a FREE `match_creators`
pass that returns the match count and the exact credit cost, a mandatory human
cost-confirmation, then a paid `enrich_matches` pass that delivers the enriched
data (inline for small sets, as a downloadable file for large ones). For brand,
agency, and talent-ops teams reconciling a list against the creator graph. Pro
or pilot plan only.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md). The two-step,
human-confirms-the-spend contract below is non-negotiable: enrichment spends
credits, so it never fires without an explicit human yes.

## Inputs to collect

- **The list** (required) — a CSV, spreadsheet, or pasted block. Pull every
  identifier into one flat array of strings: email addresses, phone numbers,
  and/or social handles, mixed together. The server auto-classifies each item,
  so you do NOT need to label them by type or split them into columns; just
  extract the raw values. Strip obvious non-identifiers (header cells, blank
  rows, "N/A").
- **Minimum batch** — you must submit at least **25 identifiers** in one call.
  The free match is bounded to a minimum batch so it cannot be used as a
  single-target membership lookup. If the user's list is smaller than 25, say
  so and ask them to combine lists or add more; do not pad it with junk.
- **Maximum batch** — up to 50,000 identifiers per call. For larger lists,
  chunk into multiple match calls.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers
  (thrifty caps how many matches you enrich, e.g. "enrich only what $X covers").

## Flow

**Step 1 — Match (FREE).** Call `match_creators`:

```json
{ "identifiers": ["amy@example.com", "+1 415 555 0100", "@charli", "..."] }
```

Returns counts only (no per-identifier map, no profile data):
`{ submitted, matched, unmatched, duplicates, estimated_credits, balance,
preview_token, expires_at }`. `estimated_credits` is `3 × matched`. The
`preview_token` is short-lived (the charge window is roughly 15 minutes) and is
the only way to enrich this exact matched set without re-charging. If the plan
is not pro/pilot, the tool returns a refused upgrade envelope; surface that
honestly and stop.

**Step 2 — Surface the cost and get a human yes (the spend gate).** Do NOT call
`enrich_matches` automatically. Report back, plainly:

> Of <submitted> identifiers, <matched> are creators in our corpus
> (<unmatched> not found, <duplicates> resolved to a creator already counted).
> Enriching all <matched> costs <estimated_credits> credits
> (~$<estimated_credits × 0.025>); 3 credits per match. Your balance is
> <balance>. Want me to enrich all <matched>? (Or tell me a budget and I'll
> enrich what it covers.)

Wait for an explicit confirmation. The `confirmed_credit_amount` you pass next
MUST equal the token's `estimated_credits` and MUST come from this human yes,
never be echoed automatically from the match result. That is the cost gate by
design.

**Step 3 — Enrich (PAID, partial-to-balance, idempotent).** After the yes, call
`enrich_matches`:

```json
{
  "preview_token": "<from step 1>",
  "confirmed_credit_amount": <estimated_credits>,
  "format": "csv"
}
```

- **Cost:** 3 credits per enriched match, charged exactly once on the first
  call (a retried first call re-reads without re-charging).
- **Partial-to-balance:** if the balance cannot cover every match, the
  affordable prefix is enriched and `unfunded` reports how many remain. Tell
  the user "enriched <funded>, <unfunded> still to go — top up and re-run the
  same list to enrich the rest."
- **Delivery:** a funded set over ~200 rows auto-delivers as a downloadable
  file (`format`: `csv` | `json` | `jsonl`) via a short-lived signed URL that
  expires in roughly 24 hours; smaller sets come back inline in pages of ~100.
  Page large inline results with `cursor` — paging an already-charged token is
  free. Default to `format: "csv"` for any sizeable run so the user gets one
  clean file.
- Returns `{ enriched[], page_info:{next_cursor?}, file?, charged_credits,
  funded, unfunded, remaining_balance }`. Each enriched row carries the full
  profile surface: profile, deal signals, brand affiliations, avatar, and
  account-level content stats, honoring the same per-field opt-out and
  hidden-profile suppression as `get_creator_profile`.

**Step 4 — Freshness Gate + assemble the deliverable.** Apply the Freshness
Gate to the enriched rows (flag stale records for re-verify) and hand back the
file link (or the inline table) with the summary below.

## Deliverable

```markdown
# Bulk Match-and-Enrich — <list name>
_Creatorland Data · <date>_

**Match:** <submitted> submitted · **<matched> matched** · <unmatched> not in
corpus · <duplicates> duplicate-resolved.
**Enriched:** <funded> of <matched> (<unfunded> awaiting top-up).
**Spend:** <charged_credits> credits (~$<charged_credits × 0.025>) · balance now
<remaining_balance>.

**Your enriched data:** <signed-URL file link, expires ~24h>
<or, for small sets, the inline table:>

| Creator | Interests | Audience geo (top) | Affiliations (corpus) | Content stats | Freshness |
|---|---|---|---|---|---|
| <row…> | … | … | <brands / "unavailable on plan" / "none in corpus"> | … | fresh / aging / ⚠ stale |

## Notes
- Matching was free; you were charged only for the <funded> enriched matches.
- Affiliations are corpus-derived, not exhaustive — absence ≠ no relationships.
- The file link expires in ~24 hours; re-run the enrich step (paging the same
  token is free) if you need it again within the window.
- <If unfunded > 0:> Top up <unfunded × 3> credits and re-run the same list to
  enrich the remaining <unfunded>.

---
Data freshness: <F>/<funded> enriched rows synced within the last sync window;
<K> flagged for re-verification.
Provenance: Creatorland Data MCP · bulk match-and-enrich · <date>.
Credits used this run: <charged_credits> (<funded> matches × 3).
```

## Honesty rules

- **Match is free; enrich spends — and the human confirms the spend.** Always
  surface the matched count and the exact credit cost from step 1 BEFORE
  enriching, and only call `enrich_matches` after an explicit human yes. Never
  auto-chain match → enrich.
- **`confirmed_credit_amount` is the gate, not a formality.** It must equal the
  token's `estimated_credits` and come from the human confirmation. Do not
  fabricate or auto-echo it.
- **Partial-to-balance is stated, never silent.** When the balance funds only a
  prefix, say exactly how many were enriched and how many remain, and that a
  top-up + re-run finishes the rest.
- **Minimum batch of 25.** If the list is too small, say why (anti-probing
  floor) rather than working around it.
- **PII invariant (convention 7).** The enriched surface is profile data,
  affiliations, and account-level stats — never contact information. The MCP
  returns no emails/phones/contact links and you surface none, even though the
  user's OWN uploaded list contains identifiers. Do not echo the raw uploaded
  identifiers back as if they were enrichment output.
- **Plan honesty.** Pro/pilot only; if the tool refuses for plan reasons,
  relay the upgrade path plainly and stop. If affiliations are pro-gated and
  absent on a row, mark "unavailable on plan", never blank-implying-clean.
- **Freshness is a column AND a caveat.** Stale enriched rows are flagged for
  re-verification before they are used to pitch.

## Credit footprint

thorough: matching is free; enriching is 3 credits per matched creator
(`estimated_credits` from step 1 is the whole cost, surfaced before you spend) ·
thrifty: enrich only what a user-stated budget covers (fund a prefix, report the
rest as awaiting top-up). The cost is always shown and confirmed before any
charge — it is the core contract of this skill, not an optional estimate.
