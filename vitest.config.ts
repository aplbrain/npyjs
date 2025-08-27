import { defineConfig } from "vitest/config";

export default defineConfig({
    test: { environment: "node" },
    resolve: {
        alias: {
            // So `import N from "../index.js"` in tests resolves to source:
            "../index.js": "/src/index.ts"
        }
    }
});
