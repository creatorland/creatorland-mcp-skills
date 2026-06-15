# Credit Modes (shared module)

Skills consume metered credits ($25 / 1,000; pro includes 5,000/mo). Every
multi-call skill supports two modes so the customer controls spend.

## Modes

- **`thorough` (default):** full fan-out — profile every candidate, walk the
  full refusal ladder, include optional enrichment calls.
- **`thrifty`:** minimum viable answer — smaller `limit` on searches, profile
  only the final cut (not the long candidate list), at most 2 refusal-ladder
  rungs, skip optional enrichment. Trigger when the user says "thrifty",
  "cheap mode", "keep credits down", or has expressed budget concern.

## Pre-run estimate (mandatory over ~30 credits)

Before a run whose planned calls exceed ~30 credits, state the estimate and
proceed (do not block):

> Estimated cost: ~38 credits (~$0.95) — 1 search (2) + 16 profiles (16) +
> 4 market-intel calls (20). Say "thrifty" if you'd like the lean version
> (~12 credits).

## Estimation table

| Call | Credits |
|---|---:|
| `search_creators` | 2 |
| `get_creator_profile` | 1 each |
| `query_market_intelligence` (incl. each ladder retry) | 5 each |
| `request_creator_connection` | 10 each (one charge per creator, whole sequence) |
| `get_connection_status` / `list_connections` | free |

## Logging convention

End every multi-call run with the actual tally:
`Credits used this run: ~N (breakdown: ...)` — customers learn the cost model
by seeing it, which builds trust in the meter.
