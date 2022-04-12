// @ts-check

import got from "./got.mjs";
import gulpGzip from "gulp-gzip";
import semver from "semver";
import { pipeline as _pipeline } from "stream";
import { promisify } from "util";
import vfs from "vinyl-fs";
import { makePackage } from "./make-package.mjs";
import { makeReleases } from "./make-releases.mjs";
import { publish } from "./publish.mjs";

const pipeline = promisify(_pipeline);

await (async () => {
  const releaseData = await got(
    "https://api.github.com/repos/earthly/earthly/releases/latest",
    { headers: { Accept: "application/vnd.github.v3+json" } }
  ).json();

  const version = semver.parse(releaseData.tag_name).version;

  const { statusCode } = await got.head(
    `https://registry.npmjs.org/earthly-cli/${version}`,
    { throwHttpErrors: false }
  );

  const packageAlreadyFound = statusCode >= 200 && statusCode < 400;

  console.log("Status", { version, statusCode, packageAlreadyFound });

  if (!packageAlreadyFound) {
    await pipeline(
      makeReleases(releaseData),
      makePackage(version),
      gulpGzip({ extension: "tgz" }),
      vfs.dest("dist"),
      /** @type {any} */ (publish)
    );
  }
})();
