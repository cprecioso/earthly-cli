// @ts-check

const normalizePlatform = (platform) => {
  switch (platform.toLowerCase()) {
    case "win":
    case "windows":
    case "win32":
      return "win32";
    case "mac":
    case "macos":
    case "osx":
    case "darwin":
      return "darwin";
    case "linux":
      return "linux";
    default:
      throw new Error(`Unknown Platform ${platform}`);
  }
};

const normalizeArch = (arch) => {
  switch (arch.toLowerCase()) {
    case "amd64":
      return "x64";
    case "arm64":
      return "arm64";
    case "arm7":
      return "arm";
    default:
      throw new Error(`Unknown Arch ${arch}`);
  }
};

export const makeReleases = function* (releaseData) {
  for (const { name, url } of releaseData.assets) {
    const [, rawPlatform, rawArch] = name.match(
      /^earthly-(.+?)-(.+?)(?:\.(.+?))?$/i
    );
    const platform = normalizePlatform(rawPlatform);
    const arch = normalizeArch(rawArch);

    yield { name, url, platform, arch };
  }
};
