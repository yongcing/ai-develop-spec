#!/usr/bin/env node
/**
 * lint-design-spec — validates that every section under <root> has the three
 * required spec artifacts (visual/ + behavior/ + data/) per
 * 00-architecture/design-to-code-workflow.md.
 *
 * Usage:
 *   node lint-design-spec.mjs <sections-root>
 *   node lint-design-spec.mjs design/sections
 *
 * Exit codes:
 *   0  all sections pass
 *   1  one or more sections have failures
 *   2  invocation error (bad path, etc.)
 *
 * No external deps; pure Node stdlib so it runs in any project repo.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";

const FORBIDDEN_TOKENS = ["TBD", "待補", "???", "TODO:"];
const REQUIRED_DATA_HEADINGS = ["Source endpoints", "Edge cases", "Permissions"];

const root = process.argv[2];
if (!root) {
  console.error("Usage: lint-design-spec <sections-root>");
  process.exit(2);
}
const absRoot = resolve(root);
if (!existsSync(absRoot) || !statSync(absRoot).isDirectory()) {
  console.error(`Not a directory: ${absRoot}`);
  process.exit(2);
}

let totalSections = 0;
let totalFailures = 0;

const sections = readdirSync(absRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
  .map((d) => d.name)
  .sort();

if (sections.length === 0) {
  console.warn(`No section subdirectories under ${absRoot}`);
}

for (const sec of sections) {
  totalSections++;
  const failures = lintSection(join(absRoot, sec), sec);
  if (failures.length === 0) {
    console.log(`✓ ${sec}`);
  } else {
    totalFailures += failures.length;
    console.log(`✗ ${sec}`);
    for (const f of failures) console.log(`    - ${f}`);
  }
}

console.log(
  `\n${totalSections} section(s) checked, ${totalFailures} failure(s).`
);
process.exit(totalFailures === 0 ? 0 : 1);

// ---------- impl ----------

function lintSection(dir, name) {
  const fails = [];
  const rel = (p) => relative(absRoot, p).split(sep).join("/");

  // visual/
  const visualDefault = join(dir, "visual", "default.png");
  if (!existsSync(visualDefault)) fails.push(`missing ${rel(visualDefault)}`);
  const measurements = join(dir, "visual", "measurements.md");
  if (!existsSync(measurements)) {
    fails.push(`missing ${rel(measurements)}`);
  } else if (readNonEmpty(measurements) === "") {
    fails.push(`empty ${rel(measurements)}`);
  }

  // behavior/interactions.md
  const interactionsPath = join(dir, "behavior", "interactions.md");
  let interactionsText = "";
  if (!existsSync(interactionsPath)) {
    fails.push(`missing ${rel(interactionsPath)}`);
  } else {
    interactionsText = readNonEmpty(interactionsPath);
    if (interactionsText === "") fails.push(`empty ${rel(interactionsPath)}`);
    else {
      // forbidden tokens
      for (const tok of FORBIDDEN_TOKENS) {
        if (interactionsText.includes(tok)) {
          fails.push(`${rel(interactionsPath)} contains forbidden token "${tok}"`);
        }
      }
      // each referenced state screenshot must exist
      const refs = extractStateRefs(interactionsText);
      for (const ref of refs) {
        const abs = join(dir, ref);
        if (!existsSync(abs)) {
          fails.push(`${rel(interactionsPath)} references missing screenshot ${ref}`);
        }
      }
      // must contain an "Interactive elements" or pipe table
      if (!/\|.*\|.*\|/.test(interactionsText)) {
        fails.push(`${rel(interactionsPath)} has no markdown table of interactions`);
      }
    }
  }

  // behavior/flow.md
  const flow = join(dir, "behavior", "flow.md");
  if (!existsSync(flow)) fails.push(`missing ${rel(flow)}`);
  else if (readNonEmpty(flow) === "") fails.push(`empty ${rel(flow)}`);

  // data/contract.md
  const contract = join(dir, "data", "contract.md");
  if (!existsSync(contract)) {
    fails.push(`missing ${rel(contract)}`);
  } else {
    const text = readNonEmpty(contract);
    if (text === "") fails.push(`empty ${rel(contract)}`);
    else {
      for (const h of REQUIRED_DATA_HEADINGS) {
        if (!new RegExp(`^#{1,6}\\s+${escapeRe(h)}`, "m").test(text)) {
          fails.push(`${rel(contract)} missing heading "${h}"`);
        }
      }
      for (const tok of FORBIDDEN_TOKENS) {
        if (text.includes(tok)) {
          fails.push(`${rel(contract)} contains forbidden token "${tok}"`);
        }
      }
    }
  }

  // orphan state screenshots (warn-level, but counted)
  const statesDir = join(dir, "visual", "states");
  if (existsSync(statesDir)) {
    const allStates = readdirSync(statesDir)
      .filter((f) => f.endsWith(".png"))
      .map((f) => `visual/states/${f}`);
    const datatxt = existsSync(contract) ? readFileSync(contract, "utf8") : "";
    const refs = new Set([
      ...extractStateRefs(interactionsText),
      ...extractStateRefs(datatxt),
    ]);
    for (const s of allStates) {
      if (!refs.has(s)) {
        fails.push(`orphan screenshot ${s} (not referenced by interactions.md or contract.md)`);
      }
    }
  }

  return fails;
}

function readNonEmpty(p) {
  try {
    return readFileSync(p, "utf8").trim();
  } catch {
    return "";
  }
}

function extractStateRefs(text) {
  const out = new Set();
  if (!text) return [];
  const re = /visual\/states\/[\w.\-]+\.png/g;
  let m;
  while ((m = re.exec(text)) !== null) out.add(m[0]);
  return [...out];
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
