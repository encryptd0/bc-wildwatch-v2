# BC WildWatch Monorepo Structure

This repository is split into separate top-level folders for frontend and backend code.

## Folders

- `frontend/` – Next.js web app (existing BC WildWatch UI + API routes).
- `backend/` – Dedicated backend workspace for a future standalone service.

## Getting started

Install dependencies from the repository root:

```bash
npm install
```

Run the frontend from the repository root:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Direct frontend commands (optional)

You can still run commands directly inside `frontend/`:

```bash
cd frontend
npm run dev
```
