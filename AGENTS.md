# Agent notes

This is a TanStack Start + Supabase application.

- Prefer editing existing files over creating new ones when possible.
- Keep the UI consistent with the existing design system (Tailwind + shadcn).
- Server functions live under TanStack Start conventions; auth is attached via middleware.
- AI calls go through `src/lib/forge.server.ts` (OpenAI-compatible gateway).
