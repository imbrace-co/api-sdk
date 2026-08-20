#!/usr/bin/env bun
import { fileURLToPath } from "url";
import path from "path";
import { $ } from "bun";
import { createClient } from "@hey-api/openapi-ts";
import fs from "fs";

const dir = fileURLToPath(new URL("..", import.meta.url));
process.chdir(dir);

const sourceApiFile = path.resolve(dir, "../../opencode/openapi.json");
const targetApiFile = path.join(dir, "openapi.json");

if (fs.existsSync(sourceApiFile)) {
  fs.copyFileSync(sourceApiFile, targetApiFile);
} else {
  console.warn("Could not find openapi.json in opencode repo. Please ensure server is running or provide openapi.json manually.");
}

if (!fs.existsSync(targetApiFile)) {
  console.error("No openapi.json found. Build aborted.");
  process.exit(1);
}

await createClient({
  input: "./openapi.json",
  output: {
    path: "./src/gen",
    tsConfigPath: path.join(dir, "tsconfig.json"),
    clean: true,
  },
  plugins: [
    {
      name: "@hey-api/typescript",
      exportFromIndex: false,
    },
    {
      name: "@hey-api/sdk",
      instance: "OpencodeClient",
      exportFromIndex: false,
      auth: false,
      paramsStructure: "flat",
    },
    {
      name: "@hey-api/client-fetch",
      exportFromIndex: false,
      baseUrl: "http://localhost:4096",
    },
  ],
});

try {
  await $`bunx prettier --write src/gen`;
} catch (e) {
  // Ignore missing prettier in standalone mode just in case
}

await $`rm -rf dist`;
await $`bunx tsc`;
