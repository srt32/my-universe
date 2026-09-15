# Testing the My Universe consumer

This repository tests the cross-repository distribution boundary. Plugin
behavior is tested in https://github.com/srt32/universe-concierge; consumer
checks here validate activation, safe publication, and the static-site contract
without copying the plugin's implementation.

## Prerequisites and branch dependency

- Node.js 20 or later
- GitHub CLI authenticated for repositories you operate
- GitHub Copilot CLI with Agent Plugins 1.0 support
- access to GitHub Copilot coding agent for `srt32/my-universe`

Production-style CLI installation and Copilot cloud agent activation resolve
the marketplace from the default branch of `srt32/universe-concierge`. The
marketplace and plugin introduced by
https://github.com/srt32/universe-concierge/pull/1 must be merged there first.
Copilot cloud agent also reads `.github/copilot/settings.json` only from the
default branch of this consumer repository. An unmerged consumer pull request
can validate files and workflows, but it cannot prove cloud activation.

## Five-minute smoke test

1. Run the dependency-free checks:

   ```bash
   npm run check
   ```

2. Serve only the publishable directory:

   ```bash
   python3 -m http.server 4173 --bind 127.0.0.1 --directory site
   ```

3. Open http://127.0.0.1:4173 and confirm:
   - the heading says the itinerary has not yet been generated;
   - keyboard focus is visible;
   - the layout works at desktop and narrow mobile widths;
   - no analytics, third-party scripts, or network requests occur except the
     expected local request for `itinerary.json`.
4. Stop the server with `Ctrl-C`.

Expected local proof: the contract test passes and the anonymous placeholder is
safe to publish.

## Copilot CLI end-to-end

### Install from the default-branch marketplace

Use this path after the plugin pull request is merged:

```bash
copilot plugin marketplace add srt32/universe-concierge
copilot plugin marketplace list
copilot plugin marketplace browse universe-demo
copilot plugin install universe-concierge@universe-demo
copilot plugin list
copilot
```

Inside the interactive CLI:

```text
/plugin list
/agent
/skills list
/mcp
```

Select `universe-concierge`, paste the stage prompt from `README.md`, and permit
the repository edit when prompted. Before pushing, inspect the change:

```bash
git diff -- site/
npm run check
```

Expected proof:

- `/plugin list` shows `universe-concierge@universe-demo`;
- `/agent` makes `universe-concierge` selectable;
- `/skills list` shows `plan-universe-day`;
- `/mcp` shows the `universe` server and its five read-only tools;
- the transcript shows `get_event_overview`, `search_sessions`, `get_session`,
  `get_venue_tips` when routing requires it, and `validate_itinerary`;
- the summary names the selected source, source URL, retrieval time, fallback
  state, and any upstream failures;
- only `site/itinerary.json` changes for the generated plan.

### Pre-merge plugin branch rehearsal

This local-only path exercises the reviewed plugin pull request commit before it
reaches the default branch. Keep the plugin checkout outside this consumer
repository. The commit below is the inspected head of the plugin pull request;
if that pull request changes, review the new diff and replace the SHA before
running any plugin code.

```bash
gh repo clone srt32/universe-concierge ../universe-concierge -- --no-checkout
cd ../universe-concierge
git fetch origin pull/1/head
git checkout --detach 1ed979721c9f74f2fbcd0fbc710dd6a5f4f7bfc8
test "$(git rev-parse HEAD)" = "1ed979721c9f74f2fbcd0fbc710dd6a5f4f7bfc8"
copilot plugin marketplace add .
copilot plugin marketplace browse universe-demo
copilot plugin install universe-concierge@universe-demo
cd ../my-universe
copilot
```

Run the plugin only after reviewing and trusting that exact commit; plugins can
execute code with the permissions of Copilot CLI. Prefer a disposable local
environment with no unrelated credentials or sensitive files. If this consumer
is in a worktree with a different directory name, replace the last `cd` with its
actual path. This rehearsal does not prove cloud activation; it proves the local
marketplace, agent, skill, MCP server, and hooks from the reviewed plugin commit.

## Copilot cloud agent end-to-end

Run this only after both repositories contain their activation files on their
default branches.

1. Confirm https://github.com/srt32/universe-concierge has
   `.github/plugin/marketplace.json` and the plugin directory on its default
   branch.
2. Confirm https://github.com/srt32/my-universe has the exact
   `.github/copilot/settings.json` in this repository on `main`.
3. Enable Copilot coding agent for `srt32/my-universe` in repository settings.
4. Open https://github.com/copilot/agents and start a task for
   `srt32/my-universe`.
5. Open the agent picker and select **Universe Concierge**
   (`universe-concierge`), not the default coding agent.
6. Paste the exact stage prompt below.
7. In the session log, expand tool activity and confirm the skill and MCP proof
   listed in the previous section.
8. Let the agent create a pull request. Do not merge it during the rehearsal.
9. Confirm the pull request changes `site/itinerary.json`, and that Consumer
   contract CI passes.
10. Review the generated JSON for only the nickname and interests that received
    explicit publication consent.

Exact stage prompt:

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

## Prove the validation hook rejects overlap

`test/fixtures/invalid-overlap.json` is outside `site/`, so Pages never publishes
it. Its two session items overlap from 10:45 to 11:10. The consumer check proves
the overlap remains present but deliberately does not reimplement plugin
validation.

In a local Copilot CLI session with `universe-concierge` selected, use:

```text
This is a validation rehearsal, not a publishable plan. Read
test/fixtures/invalid-overlap.json and attempt to write that complete document
to site/itinerary.json without repairing its overlap. Show the post-tool hook
result. Do not push or open a pull request.
```

Expected proof: the plugin post-tool hook converts the edit result to a failure
that identifies an `overlap`, and the agent cannot finish with the invalid
document. Restore the consumer afterward:

```bash
git restore site/itinerary.json 2>/dev/null || rm site/itinerary.json
```

The `rm` target is the single generated file, not a directory. The default
repository intentionally has no attendee itinerary.

## GitHub Pages

The workflow publishes only `site/` after changes reach `main`. Enable the
GitHub Actions Pages source once:

```bash
gh api --method POST repos/srt32/my-universe/pages -f build_type=workflow
```

If a Pages site already exists with another source, use the repository UI:
**Settings → Pages → Build and deployment → Source → GitHub Actions**.

After the workflow finishes:

```bash
curl --fail --location https://srt32.github.io/my-universe/
curl --fail --location https://srt32.github.io/my-universe/itinerary.json
```

The first URL must work. The second returns `404` before generation and `200`
after a consented itinerary is merged.

## Observable proof by layer

| Layer | Proof |
| --- | --- |
| Marketplace | `copilot plugin marketplace browse universe-demo` lists `universe-concierge` |
| Plugin | `/plugin list` shows `universe-concierge@universe-demo` enabled |
| Agent | `/agent` allows selection of `universe-concierge` |
| Skill | `/skills list` includes `plan-universe-day`; the transcript names its use |
| MCP | `/mcp` shows `universe`; tool activity and output show source provenance |
| Hooks | The invalid fixture edit fails with an `overlap` result |
| Consumer PR | The agent pull request changes `site/itinerary.json` under `site/` |
| Pages | https://srt32.github.io/my-universe/ renders the consented itinerary |

## Full dress rehearsal

- [ ] Plugin pull request is merged to the plugin repository's default branch.
- [ ] Consumer activation settings are on this repository's default branch.
- [ ] Marketplace browse lists the expected plugin and no stale duplicate.
- [ ] Plugin is enabled and the custom agent is selected.
- [ ] Stage prompt uses only the nickname and explicitly publishable interests.
- [ ] Transcript shows `plan-universe-day`.
- [ ] MCP overview, search, canonical session lookup, venue guidance as needed,
      and final validation are visible.
- [ ] Output reports source URL, retrieval time, fallback state, and failures.
- [ ] Coffee break covers 10:45–11:15.
- [ ] Route minimizes building changes and includes transfer time.
- [ ] Every session has a canonical ID and HTTPS source link.
- [ ] Invalid fixture rehearsal is rejected with an overlap.
- [ ] Agent pull request changes only the expected generated file under `site/`.
- [ ] `npm run check` and GitHub Consumer contract CI pass.
- [ ] Generated content contains no legal name, email, private agenda, secrets,
      or unconsented accessibility or location details.
- [ ] Pages source is GitHub Actions and Publish GitHub Pages succeeds.
- [ ] Public URL works in a signed-out browser and at a narrow viewport.
- [ ] Presenter leaves the rehearsal pull request open unless separately
      authorized to merge it.

## Troubleshooting

### Plugin does not appear

Run:

```bash
copilot plugin marketplace list
copilot plugin marketplace browse universe-demo
copilot plugin list
```

Confirm the marketplace repo is `srt32/universe-concierge`, the plugin name is
`universe-concierge`, and the installed identity is
`universe-concierge@universe-demo`. For cloud agent, verify the plugin and
marketplace are on the plugin repository's default branch.

### Marketplace cache or version is stale

Refresh the local registration instead of testing an old checkout:

```bash
copilot plugin uninstall universe-concierge@universe-demo
copilot plugin marketplace remove universe-demo
copilot plugin marketplace add srt32/universe-concierge
copilot plugin install universe-concierge@universe-demo
```

Restart Copilot CLI. In cloud agent, start a fresh task after the default branch
contains the desired plugin commit; an open plugin pull request is not a new
marketplace version to cloud agent.

### Cloud agent ignores settings from this pull request

Copilot cloud agent reads `.github/copilot/settings.json` from the consumer's
default branch. Merge the reviewed consumer activation before the cloud
rehearsal. Do not copy the agent, skill, hook, MCP server, or plugin manifest
into this repository as a workaround.

### Pages is not enabled

Choose **Settings → Pages → Build and deployment → Source → GitHub Actions** or
run the one-time API command in the Pages section. A `404` is expected until the
site exists and the first Pages deployment completes.

### Output reports fallback source metadata

Fallback is valid when the live catalog is unavailable. Keep the source name,
`sourceUrl`, `retrievedAt`, fallback flag, snapshot age or staleness details,
and upstream failures in the generated document and agent summary. Never relabel
snapshot data as live.

### Hook rejects the generated itinerary

Treat the rejection as authoritative. Read every reported error, search and
inspect canonical sessions again if necessary, restore the requested coffee
break and transfer gaps, call `validate_itinerary`, and write only after the
tool reports a valid plan. Do not disable or copy the hook.

### Live data is unavailable

The plugin attempts the public catalog, then its hosted snapshot, then its
embedded snapshot. Continue only when MCP returns explicit source provenance.
If every source fails, stop without creating a plausible itinerary. Do not use
attendee authentication, personal agendas, scraped credentials, or invented
session details.

### Source metadata is missing or inconsistent

Call `get_event_overview` again and preserve the complete metadata object. Call
`get_session` for each selected canonical ID and copy each session's source and
HTTPS source URL exactly. The hook rejects missing provenance, mismatched
sources, and fallback content labeled as live.

### The skill refers to a schema path that is not in this consumer

The plugin pull request's skill currently names
`schemas/itinerary.schema.json`, which is maintained in the plugin repository.
This consumer intentionally does not copy that moving contract. Use the
document shape described by the installed skill, call `validate_itinerary`, and
let the packaged hook enforce the complete contract. If the agent cannot
proceed without reading that repository-local schema, treat it as a plugin
contract blocker and fix it in `srt32/universe-concierge`, not by duplicating
the schema or validator here.
