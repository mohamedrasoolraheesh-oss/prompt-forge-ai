// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, nitro (build-only, Cloudflare target used by the hosting), env injection,
// the @ alias and sandbox port detection. Do NOT add those plugins manually.
// The hosting pipeline requires this wrapper — removing it breaks publishing.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({});
