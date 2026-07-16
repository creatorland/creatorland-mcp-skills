# Creatorland Data

Creator discovery, brief/transcript-to-shortlist, fair-price negotiation, and rate benchmarking for influencer-marketing teams. Connects the [Creatorland Data MCP](https://mcp.creatorland.com) and ships 47 companion skills that encode agency and brand workflows.

## Quick Start

### Vellum

```bash
assistant plugins install https://github.com/vellum-ai/creatorland-mcp-skills/tree/main/plugins/creatorland-data
```

Then in any conversation:

> "run the onboarding tour"

Or paste a campaign brief and say:

> "build a shortlist for this brief"

All 47 skills are available immediately via `skill_load`. First tool call triggers OAuth sign-in to your Creatorland Data account.

### Claude Code / Cowork

```
/plugin marketplace add creatorland/creatorland-mcp-skills
/plugin install creatorland-data@creatorland
```

Then try: `"run the onboarding tour"` or `"build a shortlist for this brief"`.

### Codex

```
codex
/plugins
```

Add the `creatorland` marketplace (this repo), then install **creatorland-data**.

For the raw MCP connection without the skill catalog, add the server to `~/.codex/config.toml` instead:

```toml
[mcp_servers.creatorland-data]
type = "http"
url = "https://mcp.creatorland.com/mcp"
```

## What's inside

| Skill | Say something like | You get |
|---|---|---|
| brief-to-shortlist | "build a shortlist for this brief" | client-ready ranked shortlist |
| transcript-to-shortlist | "here's the client call, find creators" | requirements + shortlist from a transcript |
| brief-builder | "turn this call into a creator brief" | a formal, circulate-ready brief doc |
| fair-price-brief | "is this quote fair?" | one-page negotiation memo vs market p25/median/p75 |
| one-number-rate | "what should I pay for an IG reel in beauty?" | one number + band + provenance |
| onboarding-tour | "run the onboarding tour" | guided first run of every tool |

47 skills total. Browse the full list in [`skills/`](./skills/).

## Structure

```
plugins/creatorland-data/
  .claude-plugin/plugin.json   # Claude Code manifest
  .codex-plugin/plugin.json    # Codex manifest
  .mcp.json                    # MCP server config
  skills/                      # 47 skill directories (SKILL.md each)
  shared/                      # conventions, credit modes, refusal recovery
```

## Getting started

New to Creatorland? Start at [mcp.creatorland.com](https://mcp.creatorland.com). First tool call triggers OAuth sign-in.
