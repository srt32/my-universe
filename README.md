# My Universe

This is the public consumer and demo repository for the Universe Concierge
GitHub Copilot Agent Plugin:

https://github.com/srt32/universe-concierge

The plugin provides the custom agent, `plan-universe-day` skill, read-only
Universe MCP server, and deterministic validation hooks. This repository only
enables that marketplace plugin and hosts the microsite it updates. It does not
copy or reimplement plugin components.

## Demo flow

1. GitHub Copilot loads `universe-concierge@universe-demo` from the marketplace
   registered in `.github/copilot/settings.json`.
2. A presenter selects the **Universe Concierge** custom agent.
3. The presenter shares a nickname and deliberately public interests using the
   consent language below.
4. The agent applies `plan-universe-day`, calls the read-only `universe` MCP
   tools, and validates a sourced, non-overlapping itinerary.
5. The plugin hooks constrain and validate the update to
   `site/itinerary.json`.
6. The agent opens a pull request. After review and merge, GitHub Pages
   publishes `site/` at https://srt32.github.io/my-universe/.

The checked-in site is intentionally an anonymous placeholder. It renders a
generated `site/itinerary.json` with browser-native JavaScript and no third-party
CSS, JavaScript, analytics, or tracking.

## Copy-paste stage prompt

```text
Use the plan-universe-day skill and the Universe MCP tools to create a one-day
GitHub Universe itinerary for October 28 focused on agent extensibility. Include
a real coffee break from 10:45 to 11:15, minimize room and building changes,
leave realistic transfer time, and include a public source link for every
session. Use the public display name "Orbit" and only these public interests:
agent extensibility, context engineering, and practical developer productivity.
Do not infer or publish any other personal details.

I intend this itinerary and the following public display name and interests to be published on GitHub Pages.

Create or update site/itinerary.json so the existing shareable microsite renders
the plan. Validate the complete itinerary before writing it. In your summary,
name the skill and MCP tools used, include source provenance and retrieval time,
say clearly whether the data is live or a fallback, and open a pull request.
```

The consent sentence is intentionally explicit. Do not replace the nickname
with a legal name, email, attendee account, private agenda, accessibility
details, or other personal data.

## Private/local prompt

Use this variant only in a local Copilot CLI session. It does not authorize a
public site or personal fields:

```text
Use the plan-universe-day skill and Universe MCP tools to suggest a one-day
GitHub Universe itinerary for October 28 focused on agent extensibility, with a
coffee break from 10:45 to 11:15 and minimal room changes. This is a
private/local exercise. Do not create or update site/itinerary.json, do not open
or push a pull request, and do not publish personal fields. Refer to me only as
"Private attendee". Return the sourced plan in chat, identify live versus
fallback data, and include source links.
```

## Quick verification

Requires Node.js 20 or later. No package dependencies are installed.

```bash
npm run check
```

The complete CLI, Copilot cloud agent, hook, Pages, dress-rehearsal, and
troubleshooting instructions are in `TESTING.md`.

## Activation dependency

The marketplace and plugin from
https://github.com/srt32/universe-concierge/pull/1 must exist on the default
branch of `srt32/universe-concierge` before repository-based installation or
Copilot cloud agent activation can work. Copilot cloud agent also reads this
repository's `.github/copilot/settings.json` from this repository's default
branch, not from an unmerged feature branch.

## Pages setup

After this consumer lands on `main`, choose **Settings → Pages → Build and
deployment → Source → GitHub Actions** once. The API equivalent is:

```bash
gh api --method POST repos/srt32/my-universe/pages -f build_type=workflow
```

The Pages workflow publishes only `site/`, uses least-privilege permissions, and
pins every official action to a full commit SHA.

## License

MIT. See `LICENSE`.
