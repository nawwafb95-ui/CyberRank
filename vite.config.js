import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "public/html",
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: "../../dist",
  },
});
