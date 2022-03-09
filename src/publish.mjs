import { execa } from "execa";

export const publish = async function* (
  /** @type {AsyncIterable<Vinyl>} */ files
) {
  for await (const file of files) {
    try {
      await execa("npm", ["publish", file.path], {
        stdout: "inherit",
        stderr: "inherit",
      });
    } catch {
      console.log("FAILED");
    }
  }
};
