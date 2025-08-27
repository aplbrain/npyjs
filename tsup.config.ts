import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts", "src/reshape.ts"],
    dts: true,
    format: ["esm", "cjs"],
    clean: true,
    sourcemap: true,
    treeshake: true,
    target: "es2020",
    minify: false,
});
