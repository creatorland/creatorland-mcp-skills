---
name: reply-triage
description: Triage the brand's inbound creator replies into action buckets — pull replied connections, read each one's classification (interested / question / declined) and brand-safe intent summary, then say what to do with each. Use when the user says "triage my replies", "who replied to my outreach", "draft answers to creator questions", or "what should I do with these responses". Deliverable is a triage memo: counts by bucket plus a drafted reply for everyone who asked a question. Free, read-only.
---

# Reply Triage

Outreach sequences come back with replies, and a brand staring at a stack of
"interested", "has a question", and "declined" responses needs to know what to
actually DO with each one. This skill pulls the brand's replied connections,
reads each reply's classification + brand-safe intent summary + confidence, and
sorts them into three action buckets — INTERESTED (the matchmaker is already
brokering the intro; nothing to do), QUESTION (the creator wants info first; the
skill DRAFTS a short brand-safe answer to send), and DECLINED / opted-out
(acknowledge, optionally swap in an alternate from the session's shortlist). The
deliverable is a prioritized triage memo with the drafted answers inline. It is
the **next-steps** layer; for a board/status view of the whole pipeline use
`connection-pipeline-tracker`. Free/cheap — it only reads, never reaches.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(the connection contract, entitlement/degradation, and the privacy invariants —
this is a connection-enabled skill). This skill honors thrifty/thorough credit
modes (${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md).

> This runs AFTER outreach has gone out and replies have landed (e.g. from
> `cast-and-connect`). It is **read-mostly**: it calls only `list_connections`
> and `get_connection_status` (both free) — it does NOT call
> `request_creator_connection`. Drafting an answer never reaches anyone; the
> brand sends what they approve and the matchmaker relays it.

## Inputs to collect

- **Focus** (optional) — a campaign type and/or a status to narrow to (e.g.
  "just the questions", "the SS26 campaign"). Default: all replied statuses,
  newest-first. Ask only if the user implied a filter you can't infer.
- **Alternates source** (optional) — if a shortlist from an earlier in-session
  run exists, reuse it to suggest a swap for any DECLINED creator. Never go and
  build one from scratch here — that's `brief-to-shortlist`'s job; if none is in
  session, the DECLINED bucket just acknowledges without a swap.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.
  Both modes are free or near-free here (see Credit footprint).

## Flow

**Step 0 — Entitlement / graceful degradation.** The connection tools are
entitlement-gated (`creator_connections`, pro + pilot). If `list_connections`
returns the **refused envelope** (plan without connections), do NOT error:
say "Connections aren't on your plan, so there are no outreach replies to
triage — here's how to enable outreach," and stop cleanly. Same graceful path
if the list is simply empty: "No replies yet — your sequences are still in
flight (or no outreach has gone out). Nothing to triage."

**Step 1 — Pull replied connections (free).** Call `list_connections` once per
replied status you're triaging (the API filters on a single status):
```json
list_connections { "status": "replied_interested", "limit": 100 }
list_connections { "status": "replied_question",    "limit": 100 }
list_connections { "status": "replied_declined",    "limit": 100 }
list_connections { "status": "opted_out",           "limit": 100 }
```
(Honor a narrower focus if the user gave one — e.g. only `replied_question`.)
Each row carries `conn_ref`, status, campaign type, next scheduled touch — and
**no contact info ever**. 0 credits.

**Step 2 — Read each reply's detail (free).** For every replied connection,
call `get_connection_status` to get the **classification** + the **brand-safe
intent summary** + **confidence** + touches sent:
```json
get_connection_status { "conn_ref": "<ref>" }
```
0 credits each. Work ONLY from the classification + the brand-safe intent
summary the server returns — the server already PII-scrubs reply content, and
this skill must never surface raw reply text (which could carry an address or
handle the creator typed). If a returned summary still looks like it contains
contact details, drop it to the bare classification rather than quoting it.

**Step 3 — Bucket + draft (no tool calls).**
- **INTERESTED** → the matchmaker is already brokering the double-opt-in joint
  intro. Action = *nothing to do but wait*; tell the user what to expect (an
  intro once the creator confirms; contact is still never exposed by these
  tools). Never promise it converts to a booking.
- **QUESTION** → the creator wants info before deciding. **Draft a short,
  brand-safe reply** addressing the intent summary (scope, timeline, comp band,
  usage, exclusivity — whatever the summary flags). The draft is a *suggestion
  the brand sends*; the matchmaker relays it. It handles **no contact info** and
  invents no quotes — fill comp/budget from a corpus rate band only if the brand
  already supplied one, else leave a `[brand to confirm]` placeholder.
- **DECLINED / opted-out** → acknowledge (no re-reach — opted-out creators are
  suppressed and reaching them is harassment risk). If an in-session shortlist
  exists, suggest one not-yet-contacted alternate per declined slot; otherwise
  just note the slot is open.

**Step 4 — Prioritize.** Order the memo QUESTION-first (they're the time-
sensitive, action-required set), then INTERESTED (FYI), then DECLINED (cleanup).

## Deliverable

A prioritized triage memo in markdown:

```markdown
# Reply Triage — <campaign / "all outreach">
_Creatorland Data · inbound replies as of <date>_

## Counts
- ✅ Interested: <N>   (matchmaker brokering intro — nothing to do)
- ❓ Question: <Q>     (needs a reply — drafts below)
- ⛔ Declined / opted out: <D>

## ❓ Questions — drafts to send  (do these first)
For each:
**<campaign type> · conn <ref-short> · confidence <hi/med/lo>**
- They're asking: <brand-safe intent summary — no raw reply text, no contact>
- Suggested reply (you send; matchmaker relays):
  > <2–4 sentence brand-safe draft answering the question; comp as a corpus
  > band or [brand to confirm]; no contact handling; no invented quotes>

## ✅ Interested — what to expect
<one line per interested conn: "conn <ref> (<campaign>) — matchmaker is setting
up the double-opt-in intro; you'll get a joint intro once they confirm. Nothing
to do.">

## ⛔ Declined / opted out
<one line per: acknowledge; if a session shortlist exists, "suggest swapping in
@<alt> (not yet contacted)"; else "slot open — re-cast if you want a backfill.">
<opted-out are suppressed — do not re-reach.>

---
Privacy: works from classifications + brand-safe intent summaries only; no
contact info and no raw reply text in this memo (convention 7 + connection-flow
privacy invariants). Drafts are suggestions you send — the matchmaker relays;
contact is exposed only after a creator's own yes, never by this skill.
Provenance: Creatorland Data MCP · list_connections + get_connection_status
(read-only, free) · <date>.
Credits used this run: 0 (all connection reads are free; no creators reached).
```

## Honesty rules

- **Read-only — never reaches.** This skill calls `list_connections` and
  `get_connection_status` only. It does NOT call `request_creator_connection`,
  so it never spends the 10-credit reach charge and never messages a creator.
- **Drafts are suggestions you send, not sent messages.** The skill writes the
  reply; the brand approves and sends it, and the matchmaker relays it. Say so —
  never imply the draft went out.
- **Never promise a yes.** "Interested" means the sequence got a positive reply
  and the matchmaker is brokering an intro — it is not a confirmed booking. Frame
  outcomes as the creator's to make.
- **Privacy (convention 7 + connection-flow invariants).** No contact info and
  no raw reply text in the deliverable, regardless of source. Work from the
  classification + brand-safe intent summary; if a summary looks like it carries
  contact details, drop to the bare classification. The connection's existence +
  status is brand-safe; a creator's address is not.
- **No invented comp.** Drafts fill comp/budget only from a brand-supplied or
  corpus rate band; otherwise leave `[brand to confirm]`. Never quote a figure
  the brand didn't authorize.
- **Don't re-reach the declined.** Opted-out creators are suppressed; suggesting
  re-contact is a harassment + sender-reputation risk. Acknowledge and move on;
  backfill comes from a fresh cast, not a re-poke.
- **Graceful, never error.** No replies, no entitlement, or an empty list each
  resolve to a plain-language "nothing to triage / not on your plan" — never a
  stack trace.

## Credit footprint

thorough: **0 credits** — every call here (`list_connections`,
`get_connection_status`) is free; the skill reaches no one ·
thrifty: identical (0 credits) — thrifty only trims the status filters to the
buckets the user asked for (e.g. questions only), which makes no cost
difference since the reads are already free.
