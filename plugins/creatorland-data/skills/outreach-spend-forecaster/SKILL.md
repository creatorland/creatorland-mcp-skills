---
name: outreach-spend-forecaster
description: Forecast and govern connection spend for a brand→creator outreach campaign — price reaching N creators at 10 credits each ($0.025/credit), check it against a budget/threshold, net out who's already in-flight, hold a running ledger as connections fire, and emit a per-campaign chargeback log. Use when the user says "how much will this outreach cost", "forecast my connection spend", "set an outreach budget", "don't go over N credits on outreach", or "chargeback log for this campaign". Meta-skill, 0 data credits — it accounts for spend, it doesn't reach creators.
---

# Outreach Spend Forecaster

A meta-skill that plans and governs the **connection spend** other skills incur.
It makes **no paid data calls** of its own — no `search_creators`,
`get_creator_profile`, `query_market_intelligence`, and crucially **no
`request_creator_connection`**. It only forecasts, budgets, and accounts for the
10-credit-per-creator outreach that cast-and-connect / conflict-safe-connect
actually fire. Its single free tool is `list_connections`, used to count
in-flight outreach so the user never double-spends on a creator already in a
sequence. The deliverable is a forecast block up front, a running ledger during a
firing session, and — on request — a per-campaign chargeback log for finance.

This is the connection/campaign-specific sibling of **credit-budget-guardian**
(which prices general session spend across all skills). Reach for this one when
the spend in question is *outreach* — reaching creators — and the unit is a
campaign with a named label and a head-count.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, the credit
price index, the nine conventions), ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(the connection cost model — 10 credits per creator for the **whole** 3-touch
sequence, free `list_connections`/`get_connection_status`, entitlement gating and
graceful degradation, suppression pre-screen), and
${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md (the estimation + logging convention).

## Inputs to collect

- **Planned reach** (required) — either a number **N** of creators to reach, or a
  named in-session list/shortlist/longlist already produced this session (e.g.
  "the 12 from the Acme shortlist"). If a named list, count its rows for N;
  never re-run a paid search to get the count.
- **Campaign label** (required for the chargeback log; recommended always) —
  client/campaign name the spend books against, e.g. "Acme Q3 launch".
- **Budget / threshold** (optional) — a credit or dollar ceiling for the
  campaign, and/or a "warn before any batch crosses N credits" guard line. If a
  dollar figure is given, convert at $0.025/credit.
- **Mode** — this skill is pure accounting; thrifty/thorough don't change its 0
  data-credit cost. Honor them only by reporting how the *underlying* outreach
  shape changes the forecast (fewer creators reached = fewer credits).

Never ask for anything the session already has (the list, the count, the label).

## The connection price index (ground truth — from conventions.md / connection-flow.md)

| Action | Credits | $ @ $0.025/cr |
|---|---:|---:|
| `request_creator_connection` (one charge per creator, whole 3-touch sequence) | 10 | $0.25 |
| reaching **N** creators | 10×N | $0.025×10×N |
| `list_connections` / `get_connection_status` | free | $0 |

A creator already in an **active sequence for this brand** is refused and **NOT
charged** on a repeat request — so they must be netted *out* of a forecast, not
counted. Pro-plan pricing, the monthly credit grant, and pack pricing are in `shared/conventions.md` (single source of truth) — reference them, don't restate.

## Flow

This skill orchestrates accounting, not outreach. It fires exactly one (free) tool.

1. **Establish N.** From the planned number or by counting rows in the named
   in-session list. State it back.

2. **Net out in-flight (free).** Call `list_connections`
   `{ limit: 100 }` (optionally `{ status: "queued" | "sending" | "delivered" }`
   to scope to still-active touches). Count how many of the planned creators —
   or, when reaching a fresh list, how many active outreaches already exist for
   this brand — would collide. These are **already paid for** and would be
   refused on a repeat, so the *net new* reach is `N − already_in_flight`.
   `list_connections` returns no contact info; only `conn_ref` + status + campaign
   type + next touch. Treat it as count/status data, never PII.

3. **Forecast.** Compute `gross = 10×N` and `net = 10×(N − already_in_flight)`
   credits, and the dollar cost of each at $0.025/credit. Show the arithmetic.

4. **Budget check.** If a cap was set, compare the **net** forecast to it.
   Under → green-light. Over → say by how much, and the head-count that fits the
   budget (`floor(budget_credits / 10)` creators) so the user can trim the list.
   Only recommend proceeding past the cap on explicit confirmation — this skill
   does not fire connections, so "proceeding" means handing a sized list to
   cast-and-connect / conflict-safe-connect, which run their own mandatory
   pre-flight confirm.

5. **Threshold gate.** If a "warn before crossing N credits" guard was set,
   note where in a batched roll-out the cumulative spend would cross it (e.g.
   "credits cross your 200-credit line at creator #21").

6. **Guard during firing (running ledger).** As the actual outreach skill fires
   batches (or as the user reports what fired), append each batch to the ledger:
   creators reached, credits spent (10 each, minus any refused-not-charged),
   remaining budget. **Warn before** a batch would cross the threshold or the
   cap — surface it and wait, rather than reconciling after the spend.

7. **Report.** Emit the per-campaign chargeback log on request or at campaign end.

If the harness exposes a durable workspace, persist the ledger there so it
survives the engagement; otherwise hold it in session and say it's session-scoped.

## Graceful degradation (entitlement)

If the plan isn't entitled to `creator_connections`, the *actual* outreach skills
return a refused envelope rather than reaching. This forecaster still runs in
full: it forecasts what the campaign **would** cost if connections were enabled,
shows the budget math, and appends a one-line note — _"Connections aren't on your
plan; this is the projected cost. Upgrade to pro/pilot to fire it."_ It never
dead-ends; a forecast is useful pre-purchase. `list_connections` may itself come
back empty/refused on a non-entitled plan — treat in-flight count as 0 and say so.

## Deliverable

Three artifacts depending on the ask.

**Forecast block (up front):**

```markdown
## Outreach forecast — <campaign label>
| Line | Count | Credits | $ |
|---|---:|---:|---:|
| Planned reach (N) | <N> | <10×N> | <$0.025×10×N> |
| Already in-flight (free / not re-charged) | <k> | 0 | $0 |
| **Net new reach** | **<N−k>** | **<10×(N−k)>** | **<$>** |

Budget cap: <cap or "none">. Status: <under / OVER by <X> cr — <floor(cap/10)> creators fit>.
<If threshold set:> Cumulative spend crosses your <T>-credit guard at creator #<n>.
<If not entitled:> Connections aren't on your plan — projected cost shown; upgrade to fire.
This forecaster's own cost: 0 credits (1 free list_connections call).
```

**Running ledger (during a firing session):**

```markdown
## Outreach ledger — <campaign label> · <date>
| Batch | Creators reached | Credits | $ | Cumulative cr | Remaining budget |
|---|---:|---:|---:|---:|---:|
| 1 | 8 | 80 | $2.00 | 80 | 120 |
| 2 | 4 (1 already-active, not charged) | 30 | $0.75 | 110 | 90 |
| | **Reached: 11** | **110** | **$2.75** | | |

Next batch of <m> would cross your <T>-credit guard — confirm before firing.
```

**Per-campaign chargeback log (for finance):**

```markdown
## Outreach chargeback — <campaign label>
| Campaign | Creators reached | Credits | $ @ $0.025 | Date |
|---|---:|---:|---:|---|
| <label> | <N reached> | <credits> | <$> | <YYYY-MM-DD> |

Plan balance: <if pro> ~<monthly Pro grant − month-to-date outreach credits> of the monthly Pro credit grant left (grant per `shared/conventions.md`).
Forecast vs actual: est <E> cr → actual <A> cr (<reason for any delta, e.g. "2 already-active, not charged">).
```

## Honesty rules

- **Zero data credits.** This skill makes no paid call and never fires a
  connection. Its only tool is free `list_connections`. Say so — its value is
  accounting, not reaching.
- **Estimates are pre-spend; actuals come from the meter.** A forecast is a
  projection at 10 credits/creator. The truth of what was spent is the metered
  tally the outreach skills report — always reconcile forecast vs actual in the
  ledger so the user trusts the meter (credit-modes logging convention).
- **Net, don't double-count.** Creators already in an active sequence for this
  brand are refused and **not re-charged** — net them out of the forecast.
  A clean in-flight read is "none of these are already active **in our records**,"
  never an absolute guarantee.
- **Price only from the published index.** Every line maps to the
  connection-flow / conventions.md rate (10 credits/creator, whole sequence,
  one charge). Never invent a price or imply per-email billing.
- **No promises, no contact info.** A forecast prices *reaching* creators, not
  bookings or replies — never imply a yes is purchased. `list_connections`
  returns only counts/status; no contact detail enters any deliverable
  (convention 7 / connection-flow privacy invariants). This skill sees only
  head-counts, labels, and `conn_ref`s — PII is structurally out of scope.
- **Doesn't fire — pairs with the skills that do.** Sizing a list here is not
  consent to reach it. cast-and-connect / conflict-safe-connect run the
  mandatory pre-flight (credit estimate + explicit confirm + suppression
  pre-screen) before any `request_creator_connection`.

## Credit footprint

0 data credits — this is a meta/accounting skill. It makes no paid MCP call and
fires no connections; its only tool call is the free `list_connections`. It
forecasts and tracks the 10-credit-per-creator spend that the *outreach* skills
incur.
