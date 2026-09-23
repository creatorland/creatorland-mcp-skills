---
name: creator-email-lookup
description: Find business emails for creators by Instagram, TikTok, or YouTube handle — free check, show the cost, get approval, then retrieve. Use when the user says "find emails for these creators", "get contact emails for these handles", "look up this creator's email", "who can I email at @handle", or pastes handles and wants to contact them. Deliverable: an email table plus a not-found list. Paid per creator an email is found for; see conventions.md.
---

# Creator Email Lookup

The user has a list of creators (a pasted list, a CSV, or a shortlist another
skill just produced) and wants their business emails so they can reach out
directly. This skill runs `get_creator_email`: a free check that shows what is
already on file and the maximum cost, an explicit approval, then one confirmed
call that returns the emails. It ends in a clean email table plus a list of
handles with no email found.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, plan gating, the conventions). The price and plan facts live there; do
not restate them from memory.

Calibration: if `~/.claude/plugins/config/creatorland/creatorland-data/PROFILE.md` exists (written by `/intake`), read it first — persona, familiarity (1–3), and saved defaults set narration level and assumed context (conventions.md §15).

## Inputs to collect

- **The handles** (required), each with its platform: `instagram`, `tiktok`,
  or `youtube`. A profile URL or a YouTube channel id works in place of a handle.
  Up to 100 per call; split a longer list into batches of 100.
- If the platform of a handle is unclear, ask once for the whole list rather
  than guessing per row.
- Nothing else. Do not ask for a budget up front; the free check produces the
  real number.

## Flow

1. **Clean the list.** Normalize each entry to `{ platform, handle }`, drop
   duplicates, and set aside anything that is clearly not a handle. Tell the
   user how many valid handles you have.
2. **Free check.** Call `get_creator_email` with
   `{ handles: [{ platform, handle }, ...] }` and **no** `confirmed_credit_amount`.
   It charges nothing and returns no emails: `counts` (`on_file`,
   `needs_lookup`, `invalid`), `max_credits`, and a per-handle status.
3. **Plan gate.** If the call comes back `refused` with an `upgrade` block, the
   workspace is on a plan without email lookup. Relay the upgrade message
   (it names the plan that includes it), report the free-check counts if you
   have them, and stop. Never imply the emails are available anyway.
4. **Approval.** Show the user: how many are on file, how many need a lookup,
   and `max_credits` as the most this can cost. Say that creators with no email
   found cost nothing, so the real charge is usually lower. Wait for an explicit
   yes (or a lower amount they are willing to spend).
5. **Confirmed call.** Call `get_creator_email` again with the SAME handles and
   `confirmed_credit_amount` set to the approved amount. If the approved amount
   is below `max_credits`, the tool funds as many creators as it covers and
   marks the rest `not_funded` (not charged).
6. **Report.** Build the deliverable from `results`. Re-run only for
   `not_funded` / `not_processed` handles if the user wants them; those were not
   charged.

## Deliverable

A markdown table, one row per handle:

| Platform | Handle | Matched account (followers) | Email(s) | Status |
|---|---|---|---|---|

- Put every address from `emails` in the row (a creator plus their manager or
  agency is common). Keep `matched_username` and `matched_followers` visible so
  the user can spot a handle that resolved to a different account.
- Then a **Not found** list (status `not_found`), an **Invalid** list, and any
  `not_funded` / `not_processed` / `lookup_failed` handles with the next step.
- Footer: `Credits charged: <credits_charged> · Found <n> · Not found <n>`.
- Offer a CSV of the same table.

## Honesty rules

- Only report emails the tool returned. Never guess, construct, pattern-match,
  or "complete" an address from a name or domain, and never pull emails for
  these creators from any other source.
- Emails come from Creatorland's data provider. Do not name any vendor, and do
  not claim an email is personally verified by the creator.
- Some addresses route to a manager or agency; say so when the domain makes it
  obvious, without speculating otherwise.
- A `not_found` result means "no email on file", not that the creator has none.

## Credit footprint

Free check: 0 credits. Confirmed call: the per-creator price in conventions.md
for each creator an email is found for; misses cost 0. thrifty and thorough are
the same for this skill: there is nothing optional to skip.
