#!/usr/bin/env node
/**
 * Smoke tests for lint-design-spec.mjs. No test runner, pure stdlib.
 * Run: npm test
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(tmpdir(), `lint-design-spec-${Date.now()}`);
const SCRIPT = fileURLToPath(new URL("./lint-design-spec.mjs", import.meta.url));

function setupSection(rel, files) {
  for (const [path, content] of Object.entries(files)) {
    const abs = join(ROOT, rel, path);
    mkdirSync(abs.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
    writeFileSync(abs, content ?? "");
  }
}

function run() {
  return spawnSync("node", [SCRIPT, ROOT], { encoding: "utf8" });
}

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.log(`  ✗ ${msg}`);
    failures++;
  }
}

try {
  // --- good section
  setupSection("good", {
    "visual/default.png": "",
    "visual/measurements.md": "## Layout\n- foo",
    "visual/states/hover.png": "",
    "behavior/interactions.md":
      "# x\n| el | action | result | state |\n|--|--|--|--|\n| row | hover | bg | visual/states/hover.png |\n",
    "behavior/flow.md": "default → next",
    "data/contract.md":
      "## Source endpoints\n- GET /x\n## Edge cases\n- empty\n## Permissions\n- role:any\n",
  });

  // --- bad section: missing files
  setupSection("bad-missing", {
    "visual/default.png": "",
  });

  // --- bad section: forbidden token + missing heading + missing screenshot ref
  setupSection("bad-tokens", {
    "visual/default.png": "",
    "visual/measurements.md": "x",
    "behavior/interactions.md":
      "# x\n| el | action | result | state |\n|--|--|--|--|\n| row | click | TBD | visual/states/missing.png |\n",
    "behavior/flow.md": "x",
    "data/contract.md": "## Source endpoints\n## Edge cases\n", // missing Permissions
  });

  const res = run();
  const out = res.stdout + res.stderr;
  console.log("--- lint output ---");
  console.log(out);
  console.log("--- assertions ---");

  assert(res.status === 1, "exit code 1 on failures");
  assert(out.includes("✓ good"), "good section passes");
  assert(out.includes("✗ bad-missing"), "bad-missing fails");
  assert(
    out.includes("missing bad-missing/visual/measurements.md"),
    "reports missing measurements.md"
  );
  assert(
    out.includes('contains forbidden token "TBD"'),
    "detects TBD token"
  );
  assert(
    out.includes('missing heading "Permissions"'),
    "detects missing required heading"
  );
  assert(
    out.includes("references missing screenshot visual/states/missing.png"),
    "detects missing state screenshot"
  );
} finally {
  rmSync(ROOT, { recursive: true, force: true });
}

console.log(`\n${failures === 0 ? "All tests passed" : `${failures} test(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
