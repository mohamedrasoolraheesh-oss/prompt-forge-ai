# Prompt Forge AI

A premium AI prompt engineering platform. Create, improve, transform, test, and organize prompts with a modern workspace inspired by Linear, Vercel, ChatGPT, and Notion.

## Features

- Create high-quality AI prompts from simple ideas
- Improve and optimize existing prompts
- Transform prompts for different AI models
- Test and compare prompt versions
- Structured prompt generation
- Personal library with folders, search, and filters
- Copy / export prompts
- Prompt history and versioning
- Multi-model support (via OpenAI-compatible API)

## Tech stack

- **TanStack Start** (React + Vite)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + database)
- Zod + React Hook Form

## Getting started

### Prerequisites

- Node.js 20+ (or Bun)
- A Supabase project
- An OpenAI API key (or any OpenAI-compatible endpoint)

### Environment

Copy `.env` and set:

```bash
# Supabase
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...

# AI (required for non-demo mode)
OPENAI_API_KEY=sk-...
# Optional: custom OpenAI-compatible gateway (e.g. OpenRouter)
# AI_GATEWAY_URL=https://openrouter.ai/api/v1/chat/completions
# AI_API_KEY=...
```

Without an AI key the app runs in **demo mode** with canned responses.

### Install & run

```bash
npm install   # or: bun install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Auth

Email/password via Supabase Auth. Google OAuth is supported if you enable the Google provider in your Supabase project and set the redirect URL to `/auth/callback`.

## License

Private / your project.
