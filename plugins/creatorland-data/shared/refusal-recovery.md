# Refusal Recovery Protocol (shared module)

`query_market_intelligence` enforces privacy floors: **market mode needs ≥5
brands / ≥25 deals; rate mode needs ≥10 brands / ≥50 deals** in the slice. A
slice below the floor returns a refusal (or a server-side disclosed broaden).
This module turns that into a guided staircase instead of a dead end.

## The ladder

When a call comes back refused (status `refused`, or a response stating the
floor wasn't met), retry by REMOVING the narrowest constraint, one rung at a
time, in this order:

1. Drop `deal_type` (keep vertical + sub_category)
2. Drop `sub_category` (keep vertical)
3. Drop `active_since`
4. Drop `company_type`
5. Vertical only
6. No filters (whole corpus) — rarely needed; if even this refuses, stop.

Stop at the FIRST rung that clears the floor.

## Disclosure (mandatory)

Report the clearance level in the deliverable, in plain language:

> Benchmark basis: **Beauty vertical overall** (the narrower
> "Beauty › skincare × affiliate" slice was below the privacy floor of 10
> brands / 50 deals, so the scope was widened — this is a privacy feature of
> the data source, not missing data).

Never silently present a broadened number as if it answered the narrow
question.

## Cost note

Each retry is a fresh 5-credit call. In `thrifty` mode, take at most TWO rungs
then stop and report; in `thorough` mode walk until clearance. If the first
call already came back as a server-side disclosed broaden, do not re-ladder —
use it and disclose.
