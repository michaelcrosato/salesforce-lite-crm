import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname);

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts"],
          globalSetup: [path.resolve(rootPath, "tests/setup/global.ts")],
          setupFiles: [path.resolve(rootPath, "tests/setup/db.ts")],
          testTimeout: 30000,
        },
        resolve: {
          alias: {
            "@": rootPath
          }
        }
      },
      {
        test: {
          name: "dom",
          globals: true,
          environment: "jsdom",
          include: ["tests/components/**/*.test.tsx", "tests/components/**/*.test.ts"],
          setupFiles: [path.resolve(rootPath, "tests/components/setup.ts")],
          testTimeout: 30000,
        },
        resolve: {
          alias: {
            "@": rootPath
          }
        }
      }
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["lib/**", "app/**", "components/**"],
      exclude: ["tests/**", "generated/**", "scripts/**"]
    }
  },
  resolve: {
    alias: {
      "@": rootPath
    }
  }
});
