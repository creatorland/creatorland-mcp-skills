# Creatorland plugin marketplace

Plugins that connect the **Creatorland Data MCP** and install its companion skill catalog, for [Claude Code](https://docs.claude.com/en/docs/claude-code), Claude Cowork, and [OpenAI Codex](https://developers.openai.com/codex). The same skills ship to both ecosystems from this one repo: a thin per-host manifest over a shared `skills/` catalog.

## Install (Claude Code / Cowork)

```
/plugin marketplace add creatorland/creatorland-mcp-skills
/plugin install creatorland-data@creatorland
```

## Install (Codex)

```
codex
/plugins
```

Add the `creatorland` marketplace (this repo), then install **creatorland-data**. For the raw MCP connection without the skill catalog, add the server to `~/.codex/config.toml` instead.

First tool call triggers OAuth sign-in to your Creatorland Data account. New here? Start at [mcp.creatorland.com](https://mcp.creatorland.com).

Then try: `"run the onboarding tour"` or paste a campaign brief and say `"build a shortlist for this brief"`.

## What's inside `creatorland-data`

| Skill | Say something like | You get |
|---|---|---|
| brief-to-shortlist | "build a shortlist for this brief" | client-ready ranked shortlist |
| transcript-to-shortlist | "here's the client call, find creators" | requirements + shortlist from a transcript |
| brief-builder | "turn this call into a creator brief" | a formal, circulate-ready brief doc |
| fair-price-brief | "is this quote fair?" | one-page negotiation memo vs market p25/median/p75 |
| one-number-rate | "what should I pay for an IG reel in beauty?" | one number + band + provenance |
| onboarding-tour | "run the onboarding tour" | guided first run of every tool |

## Versioning

Update the marketplace repo → users get updates on plugin refresh. Skill catalog roadmap tracked internally (Epic 7).
