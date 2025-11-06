# XGNZ Chat

A modern Next.js 14 app that showcases a polished UI component library and a local LLM chat experience powered by Ollama. It includes a marketing home page, a chat interface with streaming responses, theme support, and persistent chats/settings via IndexedDB.

## Features

- Landing page with sections: Hero, Features, Testimonials, Pricing, FAQ, and CTA
- Chat UI with sidebar threads, message streaming, quick model switcher, and file/voice input hooks
- Automatic short chat title generation for new threads
- Light/Dark/System themes via `next-themes`
- Component library built with Tailwind CSS + Radix UI + utility components
- Local persistence with IndexedDB for chats and user settings
- Simple API routes that proxy to Ollama for models, chat, and titles

## Tech Stack

- Next.js 14 (App Router)
- React 19
- TypeScript
- Tailwind CSS + Radix UI primitives + Framer Motion
- IndexedDB (client-side persistence)
- Ollama (local LLM backend)

## Getting Started

Prerequisites:

- Node.js 18+ (Node 20+ recommended)
- npm (or your preferred package manager)
- Optional: Ollama installed and running locally if you want the chat to respond

Install dependencies:

- `npm install`

Run the dev server:

- `npm run dev`
- Open `http://localhost:3000`

Production build:

- `npm run build`
- `npm start`

Lint:

- `npm run lint`

## Local LLM (Ollama)

The API routes expect an Ollama server. By default the app points to `http://localhost:11434`. You can change this with an environment variable.

- Pull a model (example): `ollama pull gemma3:latest`
- Ensure the Ollama server is running (typically started automatically when using `ollama` CLI)
- Optionally set `OLLAMA_BASE_URL` if not using the default: `http://<host>:<port>`

Environment variable:

- `OLLAMA_BASE_URL` — default: `http://localhost:11434`

Relevant API routes:

- `/api/chat` — streams assistant responses (NDJSON: `{ type: "delta" | "done", content? }`)
- `/api/models` — returns available model tags from Ollama
- `/api/title` — generates a short title for a new chat based on the first message

## Scripts

- `dev` — start Next.js in development
- `build` — build the app
- `start` — start the production server
- `lint` — run ESLint

## Project Structure

- `app/` — App Router pages and API routes
  - `app/(home)/` and `app/page.tsx` — marketing homepage
  - `app/chat/` — chat UI and layout
  - `app/api/chat` — chat proxy to Ollama (streaming)
  - `app/api/models` — list available Ollama models
  - `app/api/title` — generate a short chat title
- `components/` — UI components and chat components
- `hooks/` — custom React hooks (e.g., chats, settings, UI utilities)
- `lib/` — utilities, IndexedDB client (`lib/db.ts`), types
- `public/` — static assets
- `styles/` and `app/globals.css` — global styles and Tailwind setup

## Persistence

Client-side data is stored in IndexedDB:

- Chats: `id`, `title`, `timestamp`, `messages`, `history[]`
- Settings: toggles for notifications, message preview, saving history, and integration switches

See `lib/db.ts` and `hooks/use-chats.ts` for details.

## Notes

- TypeScript build errors are ignored in `next.config.mjs` (`typescript.ignoreBuildErrors: true`). Consider tightening for production.
- Images are served unoptimized (`images.unoptimized: true`). Adjust for your deployment as needed.

## License

No license specified. If you intend to open source this project, add a suitable license file.

