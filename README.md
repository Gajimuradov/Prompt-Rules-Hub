# Prompt Rules Hub

Prompt Rules Hub is a pet project for frontend teams that use AI assistants in daily development. It stores team rules for code style, component generation, reviews, testing, and design-system usage, then composes a final Markdown context that can be passed to an AI assistant.

The project demonstrates a practical AI-assisted development workflow: rules are versioned, categorized, linked through inheritance, validated, and exported as Markdown or JSON.

## Why This Project Exists

Frontend teams often keep AI instructions in scattered documents, chats, repository notes, and personal snippets. That makes assistant output inconsistent: one developer asks for tests, another forgets design-system constraints, and code review expectations drift over time.

Prompt Rules Hub gives the team a small internal tool to:

- Keep assistant rules in one place.
- Version and categorize rules.
- Inherit shared base behavior from parent rules.
- Compose a deterministic AI context for a task or workflow.
- Export the context as Markdown or JSON for tools such as ChatGPT, Codex, Cursor, or internal assistants.

## Stack

- React
- TypeScript
- Vite
- Zustand
- Node.js + Express
- Zod
- Local JSON storage
- CSS Modules

## Features

- Rules list with search, category filters, loading, error, and empty states.
- Rule details page with metadata, parent rules, tags, and Markdown content preview.
- Create and edit rule forms with shared Zod validation.
- Context builder that selects rules, resolves parent rules, and composes final Markdown.
- Export page for Markdown and JSON download/copy.
- Express API with CRUD endpoints and context composition.
- Seed rules for a frontend AI-assistant workflow.

## API

```txt
GET    /api/rules
GET    /api/rules/:id
POST   /api/rules
PATCH  /api/rules/:id
DELETE /api/rules/:id
POST   /api/context/compose
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server
npm run dev:web
```

Default URLs:

- Frontend: `http://localhost:5174`
- Backend: `http://localhost:4000`

Type-check and build:

```bash
npm run typecheck
npm run build
```

## Local Storage

Rules are stored in:

```txt
data/rules.json
```

There is no database. The backend reads and writes this JSON file directly, which keeps the project easy to inspect during interviews.

## Interview Demo Scenarios

1. Show the rules list and explain how categories split team policies by workflow: frontend, testing, review, design-system, and security.
2. Open a rule details page and point out versioning, parent rules, tags, and Markdown content.
3. Create a new rule, for example "Accessibility review rules", and attach it to "Base AI assistant behavior".
4. Edit a rule and show that frontend and backend share the same Zod validation model.
5. Use Context Builder to select "Component API rules" and show that parent rules are pulled into the final context.
6. Export the composed context as Markdown for an AI assistant and JSON for automation.
7. Open the backend code and explain the local JSON storage tradeoff: simple for a pet project, replaceable with a database later.

## Architecture

```txt
server/
  Express API, JSON storage, context composition

src/shared/
  Zod schemas and TypeScript types shared by frontend and backend

src/api/
  Typed frontend API client

src/store/
  Zustand rules store

src/pages/
  App pages

src/components/
  Reusable UI components

data/
  Local JSON storage with seed rules
```

## Notes For AI-Assisted Development

The key product idea is that prompts should be treated like frontend code: typed, reviewed, versioned, composed, and exported in a predictable format. This project turns AI instructions from ad hoc text into a small rules system that can grow with a team.
