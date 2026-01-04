import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["./src/index.ts"],
    format: ["cjs", "esm", "iife"],
    // 🔑 REQUIRED for <script> usage
    globalName: "EasySewa",
    platform: "browser",
    target: "es2017",
    dts: true,
    shims: true,
    clean: true,
    // Optional but recommended
    minify: true,
    sourcemap: true,
});
