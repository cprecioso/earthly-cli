// @ts-check

import slugify from "@sindresorhus/slugify";
import fs from "fs";
import got from "./got.mjs";
import gulpTar from "gulp-tar";
import path from "path/posix";
import { pipeline as _pipeline } from "stream";
import { promisify } from "util";
import Vinyl from "vinyl";

const templateReadme = new URL("../template/readme.md", import.meta.url);
const templatePackage = new URL("../template/package.json", import.meta.url);
const templateBinScript = new URL("../template/bin.js", import.meta.url);

const pipeline = promisify(_pipeline);

const moveIntoFolder = (folder) =>
  async function* (files) {
    for (const file of files) {
      file.dirname = path.join(file.dirname, folder);
      yield file;
    }
  };

const makePackageTar = async function* (
  /** @type {string} */ slug,
  /** @type {ConstructorParameters<typeof Vinyl>[0][]} */ files
) {
  const tar = gulpTar(slug);

  await pipeline(
    files.map((fileOptions) => new Vinyl(fileOptions)),
    moveIntoFolder("package"),
    tar
  );

  yield* tar;
};

export const makePackage = (/** @type {string} */ version) =>
  async function* (releases) {
    const templatePkg = JSON.parse(
      await fs.promises.readFile(templatePackage, "utf-8")
    );

    const allPkgs = new Set();

    for await (const release of releases) {
      const { platform, arch, name, url } = release;

      const pkgName = `@earthly-cli/bin-${platform}-${arch}`;
      allPkgs.add(pkgName);

      const pkgSlug = slugify(pkgName);

      yield* makePackageTar(pkgSlug, [
        {
          path: name,
          contents: got.stream(url, {
            headers: { Accept: "application/octet-stream" },
          }),
        },
        {
          path: "readme.md",
          contents: fs.createReadStream(templateReadme),
        },
        {
          path: "package.json",
          contents: Buffer.from(
            JSON.stringify({
              ...templatePkg,
              name: pkgName,
              version,
              os: [platform],
              cpu: [arch],
              main: "index.js",
              description: `${templatePkg.description} (${platform}-${arch})`,
            }),
            "utf-8"
          ),
        },
        {
          path: "index.js",
          contents: Buffer.from(
            `const path = require("path");
exports.binPath = path.resolve(__dirname, ${JSON.stringify(name)});
`,
            "utf-8"
          ),
        },
      ]);
    }

    if (allPkgs.size > 0) {
      yield* makePackageTar("earthly-cli", [
        {
          path: "bin.js",
          contents: fs.createReadStream(templateBinScript),
        },
        {
          path: "readme.md",
          contents: fs.createReadStream(templatePackage),
        },
        {
          path: "package.json",
          contents: Buffer.from(
            JSON.stringify({
              ...templatePkg,
              name: "earthly-cli",
              version,
              optionalDependencies: Object.fromEntries(
                [...allPkgs].map((pkg) => [pkg, version])
              ),
              bin: { earthly: "bin.js" },
            }),
            "utf-8"
          ),
        },
      ]);
    }
  };
