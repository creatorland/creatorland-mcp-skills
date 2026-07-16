# Creatorland Data

Creator discovery, brief/transcript-to-shortlist, fair-price negotiation, and rate benchmarking for influencer-marketing teams. Connects the [Creatorland Data MCP](https://mcp.creatorland.com) and ships 47 companion skills that encode agency and brand workflows.

## Quick start

```bash
# 1. Hatch a Vellum assistant
vellum hatch --name my-assistant --remote docker -d

# 2. Install the plugin
vellum exec my-assistant -- assistant plugins install creatorland

# 3. Start a conversation
vellum message my-assistant "run the onboarding tour"
```

The first tool call triggers OAuth sign-in to your Creatorland Data account. After that, all 47 skills are available immediately via `skill_load`.

Other things to try:

- Paste a campaign brief and say `"build a shortlist for this brief"`
- Say `"is this quote fair?"` to get a negotiation memo against market p25/median/p75
- Say `"what should I pay for an IG reel in beauty?"` for a benchmark rate

## Claude Code / Cowork

```
/plugin marketplace add creatorland/creatorland-mcp-skills
/plugin install creatorland-data@creatorland
```

Then try: `"run the onboarding tour"` or `"build a shortlist for this brief"`.

## Codex

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

## Development

The quick start uses `assistant plugins install creatorland`, which pulls from the Vellum plugin registry. To install from a specific branch or fork for QA, use the full GitHub URL form:

```bash
assistant plugins install https://github.com/vellum-ai/creatorland-mcp-skills/tree/<branch>/plugins/creatorland-data
```

## Links

- [Creatorland Data MCP](https://mcp.creatorland.com)
- [Getting started](https://mcp.creatorland.com)

MIT (c) Creatorland
