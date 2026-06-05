---
name: roster-enricher
description: Upgrade a talent spreadsheet you already own — take the customer's roster (CSV, sheet, or pasted list), reverse-look-up every row via get_creator_profile, and append interests, audience geo, freshness, and brand affiliations as new columns. Use when the user says "enrich this roster", "enrich my talent list", "add data to this spreadsheet of creators", "look up everyone in this sheet", or uploads a creator list to augment. BYO-data upgrade; per-row profile fan-out, credit estimate mandatory.
---

# Roster Enricher

The customer already owns a talent spreadsheet — this skill upgrades it in
place. It reverse-looks-up every row via `get_creator_profile` and appends
interests, audience geo, freshness, and brand affiliations as new columns,
turning a static list into a live data asset. The fan-out is 1 credit per row,
so the credit estimate is mandatory on any non-trivial roster. For agency ops
and brand-side teams with an existing roster.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

## Inputs to collect

- **The roster** (required) — CSV, spreadsheet, or pasted list. Identify the
  column that holds each creator's identifier and map it to one of the five
  identifier types (a handle column → `social_handle`, an email column →
  `email`, a Creatorland ID column → `creatorland_user_id`, etc.). If rows mix
  types, map each row to its own type. Ask once which column is the identifier
  only if it's ambiguous.
- **Which fields to append** — default all four (interests, audience geo,
  freshness, affiliations); honor "just add geo and freshness" etc.
- **Output format** — default: return the enriched table as markdown plus an
  appended-columns CSV the user can paste back into their sheet.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

**Step 0 — Count rows and estimate (mandatory).** Roster enrichment is a
1-credit-per-row fan-out, so the **pre-run credit estimate is mandatory
whenever the roster exceeds ~30 rows** (and stated regardless once N×1 > 30):

> Estimated cost: ~<N> credits (~$<N×0.025>) — <N> profiles, 1 credit each.
> Say "thrifty" to enrich only rows missing data, or cap the row count.

Proceed after stating it (do not block). **Thrifty:** enrich only rows the
sheet doesn't already have data for, or cap to a user-named N and report which
rows were skipped.

**Step 1 — Reverse-look-up each row** — `get_creator_profile` per row:
`{ "identifier": { "type": "<row's type>", ... } }` (exactly one identifier
type per call, matching that row). Capture interests, hashtags, audience geo,
follower count, **data freshness**, and **brand affiliations** (pro plan;
note "unavailable on plan" per row if absent rather than leaving blank).
Rows whose identifier doesn't resolve get a "not found in corpus" marker —
never silently dropped. 1 credit per resolved call.

**Step 2 — Freshness Gate** — classify each enriched row fresh / aging /
stale. The freshness column is one of the appended columns; stale rows also
get the standard "re-verify before pitch" treatment in the data note.

**Step 3 — Assemble the enriched table** (no tool calls) — original columns +
appended columns, plus the not-found and freshness summary.

## Deliverable

The enriched roster as a markdown table (and a CSV block to paste back):

```markdown
# Enriched Roster — <roster name>
_Creatorland Data · <date> · <N> rows, <R> resolved_

| <original cols…> | Interests | Audience geo (top) | Affiliations (corpus) | Freshness |
|---|---|---|---|---|
| <row…> | <interests> | <geo %> | <brands / "unavailable on plan" / "none in corpus"> | fresh / aging / ⚠ stale |
<one row per roster entry; unresolved rows show "— not found in corpus —">

## Not found in corpus
<rows whose identifier didn't resolve, with the identifier shown; or "None.">

## Notes
- Affiliations are **corpus-derived, not exhaustive** — absence ≠ no
  relationships.
- Freshness reflects last sync; ⚠ stale rows should be re-verified before
  pitching (counts may have drifted).
- No contact information is appended (by design) — even where your source
  sheet contains it, this skill does not surface or copy it into the data
  columns.

---
Data freshness: <F>/<R> resolved rows synced within the last sync window;
<K> flagged for re-verification.
Provenance: Creatorland Data MCP · <R> profile look-ups · <date>.
Credits used this run: ~<R> (<R> profiles ×1).
```

(Append a CSV code block with just the new columns, keyed by the identifier,
so the user can VLOOKUP/paste it back into their own sheet.)

## Honesty rules

- **Credit estimate is mandatory** on any roster over ~30 rows — the fan-out
  is the whole cost, so the customer must see it before it runs.
- **Affiliations are corpus-derived, not exhaustive** — note this on the
  table; absence is "none found in corpus".
- **Unresolved rows are surfaced, never dropped** — "not found in corpus".
- **Freshness is a column AND a caveat** — stale rows flagged for re-verify.
- **PII invariant (convention 7).** No contact info is appended to the
  enriched columns regardless of source — including contact data already in
  the customer's own uploaded sheet. The MCP returns none; you add none.
- **Plan honesty.** If affiliations are pro-gated and absent, the column says
  "unavailable on plan", never blank-implying-clean.

## Credit footprint

thorough: ~N credits for an N-row roster (1 profile per row) · thrifty:
~credits for rows missing data only (or a user-capped N), with skipped rows
reported. Estimate stated up front whenever N×1 exceeds ~30 credits.
