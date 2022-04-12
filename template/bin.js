#!/usr/bin/env node

// @ts-check

const child_process = require("child_process");
const process = require("process");

const depName = `@earthly-cli/bin-${process.platform}-${process.arch}`;

try {
  const { binPath } = require(depName);
  const args = process.argv.slice(2);
  child_process.spawnSync(binPath, args, { stdio: "inherit" });
} catch {
  console.error("No supported platform found (looking for " + depName + ")");
  process.exit(1);
}
