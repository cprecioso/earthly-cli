// @ts-check

import slugify from "@sindresorhus/slugify";
import fs from "fs";
import got from "got";
import gulpTar from "gulp-tar";
import path from "path/posix";
import { pipeline as _pipeline } from "stream";
import { promisify } from "util";
import Vinyl from "vinyl";

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

export const makePackage = async function* (releases) {
  const templatePkg = JSON.parse(
    await fs.promises.readFile("template/package.json", "utf-8")
  );

  const allPkgs = new Set();
  let allVersion;

  for await (const release of releases) {
    const { platform, arch, name, url, version } = release;

    const pkgName = `@earthly-cli/bin-${platform}-${arch}`;
    allPkgs.add(pkgName);
    allVersion = version;
    const pkgSlug = slugify(pkgName);

    yield* makePackageTar(pkgSlug, [
      {
        path: path.join(name),
        contents: got.stream(url, {
          headers: { Accept: "application/octet-stream" },
        }),
      },
      {
        path: "readme.md",
        contents: fs.createReadStream("template/readme.md"),
      },
      {
        path: path.join("package.json"),
        contents: Buffer.from(
          JSON.stringify({
            ...templatePkg,
            name: pkgName,
            version: version,
            os: [platform],
            cpu: [arch],
            bin: { earthly: name },
            description: `${templatePkg.description} (${platform}-${arch})`,
          }),
          "utf-8"
        ),
      },
    ]);
  }

  if (allVersion) {
    yield* makePackageTar("earthly-cli", [
      {
        path: "bin.js",
        contents: fs.createReadStream("template/bin.js"),
      },
      {
        path: "readme.md",
        contents: fs.createReadStream("template/readme.md"),
      },
      {
        path: "package.json",
        contents: Buffer.from(
          JSON.stringify({
            ...templatePkg,
            name: "earthly-cli",
            version: allVersion,
            optionalDependencies: Object.fromEntries(
              [...allPkgs].map((pkg) => [pkg, allVersion])
            ),
            bin: { earthly: "bin.js" },
          }),
          "utf-8"
        ),
      },
    ]);
  }
};
