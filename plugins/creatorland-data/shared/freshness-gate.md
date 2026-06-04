# Freshness Gate (shared module)

`get_creator_profile` returns data-freshness information with every profile.
Client-facing output must never present stale data as current.

## The gate

Before a creator goes on any client-facing list (shortlist, slate, rate card,
diligence report):

1. Read the freshness field(s) on the profile response.
2. Classify: **fresh** (synced within the freshness SLA the response
   indicates), **aging** (older but plausibly current), **stale** (old enough
   that follower counts / affiliations may have drifted).
3. Fresh → include normally. Aging → include with a freshness note in the
   row. Stale → include ONLY in a separate **"re-verify before pitch"**
   section, never silently mixed into the main list (in `thrifty` mode you may
   drop stale rows entirely and say how many were dropped).

## Output convention

Every client-facing list ends with a one-line data note:

> Data freshness: N/M creators synced within the last sync window; K flagged
> for re-verification before pitching.

## Why this is a feature

Agencies get burned pitching a creator whose situation changed. The gate turns
the MCP's freshness metadata into a trust signal competitors don't surface.
