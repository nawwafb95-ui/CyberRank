import { defineConfig } from "vite";
import { resolve, basename } from "path";
import { readdirSync, existsSync } from "fs";

function getHtmlFiles() {
  const inputs = {};

  // main entry
  inputs["index"] = resolve(__dirname, "public/index.html");

  // other pages in public/html
  const htmlDir = resolve(__dirname, "public/html");
  if (existsSync(htmlDir)) {
    const files = readdirSync(htmlDir).filter((f) => f.endsWith(".html"));
    for (const file of files) {
      const name = basename(file, ".html"); // about, login, signup...
      inputs[name] = resolve(htmlDir, file);
    }
  }

  // admin pages (optional)
  const adminDir = resolve(__dirname, "public/admin");
  if (existsSync(adminDir)) {
    const files = readdirSync(adminDir).filter((f) => f.endsWith(".html"));
    for (const file of files) {
      const name = `admin-${basename(file, ".html")}`; // admin-index...
      inputs[name] = resolve(adminDir, file);
    }
  }

  return inputs;
}

export default defineConfig({
  root: "public",
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: getHtmlFiles(),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
