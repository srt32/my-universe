import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const requiredFiles = [
  ".github/copilot/settings.json",
  ".github/workflows/ci.yml",
  ".github/workflows/pages.yml",
  "LICENSE",
  "README.md",
  "TESTING.md",
  "site/app.js",
  "site/index.html",
  "site/styles.css",
  "test/fixtures/invalid-overlap.json"
];

const forbiddenPaths = [
  ".github/plugin",
  "plugins",
  ".github/agents",
  ".github/skills",
  ".github/hooks",
  "mcp.json",
  "plugin.json"
];

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function parseJson(path) {
  return JSON.parse(read(path));
}

function actionUses(workflow) {
  return [...workflow.matchAll(/^\s*uses:\s*([^@\s]+)@([0-9a-f]+)\s*$/gm)];
}

function minutes(value) {
  const timestamp = Date.parse(value);
  assert.ok(Number.isFinite(timestamp), `Invalid fixture time: ${value}`);
  return timestamp;
}

export function validateRepository() {
  for (const path of requiredFiles) {
    assert.ok(existsSync(resolve(root, path)), `Missing required file: ${path}`);
  }

  for (const path of forbiddenPaths) {
    assert.ok(
      !existsSync(resolve(root, path)),
      `Consumer must not copy plugin implementation: ${path}`
    );
  }

  const settings = parseJson(".github/copilot/settings.json");
  assert.deepEqual(settings, {
    extraKnownMarketplaces: {
      "universe-demo": {
        source: {
          source: "github",
          repo: "srt32/universe-concierge"
        }
      }
    },
    enabledPlugins: {
      "universe-concierge@universe-demo": true
    }
  });

  const html = read("site/index.html");
  const script = read("site/app.js");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /itinerary has not yet been generated/i);
  assert.doesNotMatch(html + script, /\binnerHTML\b/);
  assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)/);

  const workflows = {
    ci: read(".github/workflows/ci.yml"),
    pages: read(".github/workflows/pages.yml")
  };
  for (const [name, workflow] of Object.entries(workflows)) {
    const uses = actionUses(workflow);
    assert.ok(uses.length > 0, `${name} workflow must use pinned actions`);
    for (const [, action, sha] of uses) {
      assert.equal(sha.length, 40, `${action} must be pinned to a full SHA`);
    }
  }
  assert.match(workflows.ci, /contents:\s*read/);
  assert.match(workflows.pages, /contents:\s*read/);
  assert.match(workflows.pages, /pages:\s*write/);
  assert.match(workflows.pages, /id-token:\s*write/);
  assert.match(workflows.pages, /path:\s*site/);
  assert.match(workflows.pages, /cancel-in-progress:\s*false/);
  for (const action of [
    "actions/checkout",
    "actions/configure-pages",
    "actions/upload-pages-artifact",
    "actions/deploy-pages"
  ]) {
    assert.match(workflows.pages, new RegExp(`uses:\\s*${action}@`));
  }

  const documentation = read("README.md") + read("TESTING.md");
  assert.match(documentation, /I intend this itinerary and the following public display name and interests to be published on GitHub Pages\./);
  assert.match(documentation, /private\/local/i);
  assert.match(documentation, /default branch/i);
  assert.match(documentation, /hook rejects|hook.*reject/i);
  assert.doesNotMatch(documentation, /\[[^\]]+\]\(https:\/\/github\.com\//);

  const fixture = parseJson("test/fixtures/invalid-overlap.json");
  assert.ok(Array.isArray(fixture.items) && fixture.items.length >= 2);
  const [first, second] = fixture.items;
  assert.ok(
    minutes(first.start) < minutes(second.end) &&
      minutes(second.start) < minutes(first.end),
    "Invalid fixture must contain overlapping items"
  );

  return `Validated ${relative(process.cwd(), root) || "."} consumer contract`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(validateRepository());
}
