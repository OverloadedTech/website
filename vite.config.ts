import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const PAGES = process.env["PAGES_BUILD"] === "1";
const FILE = process.env["FILE_BUILD"] === "1";
const STATIC = PAGES || FILE;
const BASE = FILE ? "./" : process.env["BASE_PATH"] || "/";

export default defineConfig({
  ...(STATIC
    ? {
        vite: {
          base: BASE,
          ...(FILE
            ? {
                build: {
                  assetsInlineLimit: 100 * 1024 * 1024,
                  rollupOptions: { output: { inlineDynamicImports: true } },
                },
              }
            : {}),
        },
      }
    : {}),
  tanstackStart: {
    server: { entry: "server" },
    ...(STATIC
      ? {
          prerender: { enabled: true, crawlLinks: true },
          pages: [
            { path: "/" },
            { path: "/projects" },
            { path: "/blog" },
            { path: "/likes" },
            { path: "/contact" },
          ],
        }
      : {}),
  },
  ...(STATIC ? { nitro: false as const } : {}),
});
