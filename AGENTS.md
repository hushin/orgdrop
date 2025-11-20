# OrgDrop - Agent Documentation

This document provides context and guidelines for AI agents working on the OrgDrop codebase.

## Project Overview

OrgDrop is a web-based Org-mode file viewer that integrates with Dropbox. It allows users to view their Org files, search through them, and see their agenda, all directly from a browser, syncing with their Dropbox account.

## Architecture

The project consists of two main parts:

1.  **Frontend (`/`)**: A Single Page Application (SPA) built with React, Vite, and TypeScript.
    -   **Clean Architecture**: The frontend follows Clean Architecture principles.
        -   `src/domain`: Core business logic and types (e.g., `OrgFile`, `OrgNode`).
        -   `src/usecase`: Application logic (e.g., `FetchFilesUseCase`).
        -   `src/repository`: Interfaces for data access (e.g., `FileRepository`).
        -   `src/ui`: React components and hooks.
    -   **Styling**: Tailwind CSS is used for styling.

2.  **Backend (`/worker`)**: A Cloudflare Worker that acts as a proxy/middleware for Dropbox API interactions.
    -   Handles OAuth authentication with Dropbox.
    -   Proxies file requests to avoid CORS issues and handle security.
    -   **Entry Point**: `worker/src/index.ts`.

## Key Directories

-   `src/`: Frontend source code.
    -   `src/domain/org/`: Org-mode parsing logic.
    -   `src/ui/components/`: Reusable UI components.
    -   `src/ui/pages/`: Top-level page components.
-   `worker/`: Cloudflare Worker source code.
-   `docs/`: Project documentation.
    -   `docs/plan.md`: The master plan and roadmap. **Always check this for the current status and next tasks.**

## Development Workflow

### Frontend
-   **Run**: `npm run dev` (starts Vite dev server).
-   **Build**: `npm run build`.
-   **Test**: `npm run test` (using Vitest).

### Backend (Worker)
-   **Directory**: `cd worker`
-   **Run**: `npm run dev` (starts Wrangler dev server).
-   **Deploy**: `npm run deploy`.

## Conventions

-   **Language**: TypeScript for everything.
-   **Styling**: Tailwind CSS utility classes. Avoid custom CSS files where possible.
-   **State Management**: React Context and Hooks.
-   **Org Parsing**: The parser is custom-built in `src/domain/org`. When adding support for new Org features, modify the parser there.

## Important Notes

-   **Dropbox Integration**: The app relies on a Dropbox App. The Client ID and other secrets are managed via environment variables in the Worker.
-   **Mocking**: `MockFileRepository` is used for local development without a real Dropbox connection. `RemoteFileRepository` connects to the Worker.
