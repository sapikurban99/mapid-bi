import { execSync } from "child_process";
import type { NextConfig } from "next";

let appVersion = "0.1.0";
try {
  const commitCount = execSync('git rev-list --count HEAD').toString().trim();
  appVersion = `0.1.${commitCount}`;
} catch (e) {
  console.warn("Could not determine git commit count for versioning.");
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  reactCompiler: true,
};

export default nextConfig;
