// @ts-check

import got from "got";
import gulpGzip from "gulp-gzip";
import { pipeline as _pipeline } from "stream";
import { promisify } from "util";
import vfs from "vinyl-fs";
import { makePackage } from "./make-package.mjs";
import { makeReleases } from "./make-releases.mjs";
import { publish } from "./publish.mjs";

const pipeline = promisify(_pipeline);

void (async () => {
  const releaseData = await got(
    "https://api.github.com/repos/earthly/earthly/releases/latest",
    { headers: { Accept: "application/vnd.github.v3+json" } }
  ).json();

  await pipeline(
    makeReleases(releaseData),
    makePackage,
    gulpGzip({ extension: "tgz" }),
    vfs.dest("dist"),
    /** @type {any} */ (publish)
  );
})();
