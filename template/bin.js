#!/usr/bin/env node

// @ts-check

const child_process = require("child_process");
const path = require("path").posix;
const process = require("process");

void (() => {
  const depName = `@earthly-cli/bin-${process.platform}-${process.arch}`;

  try {
    const depPkg = require(path.join(depName, "package.json"));
    const binPath = require.resolve(path.join(depName, depPkg.bin.earthly));
    const args = process.argv.slice(2);
    return child_process.spawn(binPath, args, {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  } catch {
    console.error("No supported platform found");
    process.exit(1);
  }
})();
