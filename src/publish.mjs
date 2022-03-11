// @ts-check

import { execa } from "execa";
import PQueue from "p-queue";

const queue = new PQueue({ concurrency: 1 });

export const publish = async function* (
  /** @type {AsyncIterable<import("vinyl")>} */ files
) {
  const promises = [];

  for await (const file of files) {
    const promise = queue.add(() =>
      execa("npm", ["publish", file.path], {
        stdout: "inherit",
        stderr: "inherit",
      })
    );
    promises.push(promise);
  }

  // Wait until we do everything
  await Promise.allSettled(promises);
  // Then throw an error if any failed
  await Promise.all(promises);
};
