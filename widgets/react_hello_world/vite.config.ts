import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve, dirname } from "path";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractFragment() {
  return {
    name: "extract-fragment",
    writeBundle() {
      const distPath = resolve(__dirname, "dist/index.html");
      const cssPath = resolve(__dirname, "src/App.css");
      const outputPath = resolve(__dirname, "content.html");

      const html = readFileSync(distPath, "utf-8");
      const css = readFileSync(cssPath, "utf-8");

      const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script(?:\s+[^>]*)?>/i);
      const scriptContent = scriptMatch ? scriptMatch[1] : "";

      const fragment = `<style>${css}</style>\n<hello-world-widget></hello-world-widget>\n<script>${scriptContent}</script>`;

      writeFileSync(outputPath, fragment);
      console.log("✓ Built content.html");
    },
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), extractFragment()],
  build: {
    target: "esnext",
    minify: true,
    cssMinify: true,
  },
});
