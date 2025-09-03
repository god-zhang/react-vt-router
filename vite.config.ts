import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  // 使用相对 base，便于 GitHub Pages（项目页）静态部署
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // 让示例在仓库内直接引用源码，而不是已发布的包
      "react-vt-router": fileURLToPath(
        new URL("./src/lib/index.ts", import.meta.url)
      ),
    },
  },
});
