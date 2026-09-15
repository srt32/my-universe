import test from "node:test";
import assert from "node:assert/strict";

import { validateRepository } from "../scripts/validate-consumer.mjs";

test("repository satisfies the Universe Concierge consumer contract", () => {
  assert.match(validateRepository(), /Validated .* consumer contract/);
});
