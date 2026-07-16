---
name: credit-budget-guardian
description: Plan and track credit spend across a session before running expensive MCP workflows — estimate cost up front, hold a per-job ledger, warn over a threshold, and produce a chargeback log. Use when the user says "how many credits will this cost", "track my credit spend", "set a credit budget", "don't go over N credits", or "log credits for chargeback". Meta-skill, 0 data credits — it does no market/profile calls itself, it only prices and accounts for other skills.
---

# Credit Budget Guardian

A meta-skill that wraps the other skills in this plugin. It spends **zero data
credits** — it makes no `search_creators`, `get_creator_profile`, or
`query_market_intelligence` calls. Its job is to price a planned workflow from
the credit index BEFORE it runs, hold the user to a budget if they set one,
and keep a per-job ledger the operator can use for internal chargeback. Use it
to put a cost cap and an audit trail around any of the casting/pricing skills.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, the
credit price index, the nine conventions) and
${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md (the estimation table and the
thrifty/thorough contract this skill enforces).

## Inputs to collect

- **The workflow to price** (required) — which skill(s) the user is about to
  run, and the shape that drives cost: number of creators to profile, number
  of searches, number of market-intel calls / expected refusal-ladder depth,
  thrifty vs thorough.
- **Budget cap** (optional) — a credit or dollar ceiling for this job or this
  session. If set, the guardian flags when a plan would exceed it.
- **Threshold for confirmation** (default: ~30 credits, matching the
  credit-modes pre-run convention) — over this, surface the estimate and ask
  before proceeding.
- **Job label** (optional) — client/campaign name for the chargeback ledger
  line.

## The price index (ground truth — from conventions.md)

| Call | Credits | $ @ $0.025/cr |
|---|---:|---:|
| `get_creator_profile` | 1 | $0.025 |
| `search_creators` | 2 | $0.05 |
| `query_market_intelligence` (each call AND each refusal-ladder retry) | 5 | $0.125 |
| profile fan-out of N | 1×N | $0.025×N |

Pro plan = 2,000 credits / $199 mo (metered; packs cover overage). Pack price = $25 / 1,000 credits.

## Flow

This skill orchestrates accounting, not data tools.

1. **Estimate** — decompose the planned workflow into priced line items from
   the index and sum them for both thorough and thrifty paths. Show the
   arithmetic. Convert to dollars at $0.025/credit.

2. **Budget check** — if a cap was set, compare the thorough estimate to it.
   Under → green-light. Over → recommend the thrifty path (show its cost) or
   a reduced shape (smaller `limit`, profile only the final cut, cap ladder
   rungs), and only proceed past the cap on explicit user confirmation.

3. **Threshold gate** — if the estimate exceeds the confirmation threshold,
   present the credit-modes-style estimate line and wait for go-ahead.

4. **Track** — as the wrapped workflow runs (or after the user reports what
   ran), append actual line items to the session ledger. The estimate vs
   actual delta is itself a deliverable — it teaches the cost model.

5. **Report** — emit the ledger / chargeback log on request or at job end.

If the harness exposes a durable workspace, persist the ledger there so it
survives within the engagement; otherwise hold it in session and say it's
session-scoped.

## Deliverable

Two artifacts depending on the ask.

**Pre-run estimate:**

```markdown
## Credit estimate — <workflow / skill name>
| Line item | Count | Credits | $ |
|---|---:|---:|---:|
| search_creators | 3 | 6 | $0.15 |
| get_creator_profile | 18 | 18 | $0.45 |
| query_market_intelligence (incl. ladder) | 4 | 20 | $0.50 |
| **Thorough total** | | **44** | **$1.10** |
| **Thrifty total** | | **~14** | **$0.35** |

Budget cap: <cap or "none">. Status: <under / OVER by N cr — recommend thrifty>.
<If over threshold:> This exceeds your ~<threshold>-credit confirmation line —
say "go" to run thorough, or "thrifty" for the lean path.
```

**Chargeback ledger:**

```markdown
## Credit ledger — <session / date>
| # | Job label | Skill | Est. cr | Actual cr | $ | Notes |
|---|---|---|---:|---:|---:|---|
| 1 | Acme Q3 cast | brief-to-shortlist | 22 | 20 | $0.50 | 1 stale profile dropped |
| 2 | Acme Q3 price | fair-price-brief | 11 | 16 | $0.40 | +1 refusal-ladder rung |
| | | **Session total** | **33** | **36** | **$0.90** | |

Plan balance: <if pro> ~<monthly Pro grant − running total> of the monthly Pro credit grant left (grant per `shared/conventions.md`).
Estimate accuracy this session: <actual vs est delta, with the one-line reason>.
```

## Honesty rules

- **Zero data credits.** This skill never calls the data tools; its own cost
  is 0 credits. Say so — its value is accounting, not data.
- **Price only from the published index.** Every line item maps to a
  conventions.md rate. Never invent a price; if a workflow's shape is
  unknown, give a range and label the assumption.
- **Refusal-ladder rungs are real credits.** Each market-intel retry is a
  fresh 5-credit call — estimates must include a likely-rungs assumption and
  name it (thin verticals cost more).
- **A plan gate is an upgrade, not a spend.** When a workflow includes a
  pro-only tool (market intelligence, enrichment, connections) on a plan that
  lacks it, the call returns a machine-readable **`upgrade` envelope** and costs
  **0 credits** — nothing is charged for a gated call. Log it as "available on
  Pro / upgrade to unlock" in the ledger, never as a failed or "unavailable"
  line item.
- **Estimates are estimates.** Actuals can exceed them (extra rungs, larger
  candidate sets); always reconcile estimate vs actual in the ledger so the
  user trusts the meter (credit-modes logging convention).
- **No data leaves this skill** — it sees only counts and labels, never
  profile contents, so PII (convention 7) is structurally not in scope.

## Credit footprint

0 data credits — this is a meta/accounting skill and makes no MCP data calls.
It prices and tracks the credits OTHER skills spend.
