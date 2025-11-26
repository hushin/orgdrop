# OrgDrop

OrgDrop is a modern, web-based Org-mode viewer that seamlessly integrates with Dropbox. It allows you to access, search, and manage your Org files from anywhere, with a clean and responsive UI.

## Features

### ✅ Core Functionality
-   **Org-mode Parsing**: Supports headings, lists, TODOs, links, and images.
-   **Dropbox Integration**: Securely connects to your Dropbox to fetch and display Org files.
-   **Responsive Design**: Optimized for both desktop and mobile devices.
-   **Clean Architecture**: Built with maintainability and scalability in mind.

### ✅ Key Capabilities
-   **File Browser**: Navigate your Dropbox folder structure to find Org files.
-   **Org Agenda**: View all your TODO tasks in a consolidated list.
-   **Search**: Full-text search across your Org files with line number indication.
-   **Image Rendering**: Displays images referenced in your Org files (supports Dropbox-hosted images).

## Tech Stack

-   **Frontend**: React, Vite, TypeScript
-   **Styling**: Tailwind CSS
-   **Backend**: Cloudflare Workers (for Dropbox API proxying)
-   **Testing**: Vitest

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   pnpm (v9 or later)
-   A Dropbox account and a Dropbox App (for API credentials)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/hushin-sandbox/orgdrop.git
    cd orgdrop
    ```

2.  Install dependencies (from root):
    ```bash
    pnpm install
    ```

3.  Build shared packages:
    ```bash
    pnpm -r run build
    ```

### Configuration

1.  **Backend (Cloudflare Worker)**:
    -   Create a `.dev.vars` file in the `apps/worker/` directory.
    -   Add your Dropbox App credentials:
        ```
        DROPBOX_APP_KEY=your_app_key
        DROPBOX_APP_SECRET=your_app_secret
        DROPBOX_ROOT_PATH=/path/to/org/files  # Optional
        ```

2.  **Agenda Configuration**:
    -   To configure which files are included in the Agenda view (similar to `org-agenda-files`), create a file named `orgdrop.json` in the root of your Dropbox folder (or the folder specified by `DROPBOX_ROOT_PATH`).
    -   **Example `orgdrop.json`**:
        ```json
        {
          "agendaPaths": [
            "todo.org",
            "projects/",
            "work/active.org"
          ]
        }
        ```
    -   **Files**: Specify the relative path to the file (e.g., `todo.org`).
    -   **Directories**: Specify the directory path ending with `/` (e.g., `projects/`). All `.org` files within this directory (recursively) will be included.

### Running the App

1.  Start the App (Frontend + Backend):
    ```bash
    # From the root directory
    pnpm dev
    ```
    This will start both the Frontend (Vite) and Backend (Worker) in parallel.

2.  Open your browser at `http://localhost:5173`.

## Deployment

### 1. Cloudflare Worker KV Setup

Before deploying, you need to create a KV namespace for caching Dropbox files.

```bash
# Create KV namespace
npx wrangler kv namespace create DROPBOX_CACHE

# For production, you might want to create a separate one
npx wrangler kv namespace create DROPBOX_CACHE --env production
```

Update `apps/worker/wrangler.jsonc` with the `id` and `preview_id` (if applicable) from the output.

### 2. Environment Variables

You need to set the following environment variables in your Cloudflare Worker settings (Settings -> Variables):

- `DROPBOX_APP_KEY`: Your Dropbox App Key
- `DROPBOX_APP_SECRET`: Your Dropbox App Secret
- `DROPBOX_ROOT_PATH`: Root path in Dropbox (e.g., `/org`)

### 3. Dropbox App Configuration

In your Dropbox App Console:
- Add the Redirect URIs:
    - Production: `https://<YOUR_WORKER_URL>/auth/callback`
    - Local Development: `http://localhost:5173/auth/callback`
- Ensure `files.content.read` and `files.metadata.read` permissions are enabled.

### 4. Deploy (Unified)

Deploy both the Frontend and Backend as a single Cloudflare Worker.

```bash
# From root
pnpm run build
pnpm run deploy
```

This command will:
1.  Build the Frontend (Vite) to `apps/frontend/dist`.
2.  Deploy the Worker from `apps/worker`, serving the static assets from `../frontend/dist` and executing the API logic.

**Note:** Ensure you have set the environment variables (secrets) in Cloudflare Dashboard or using `wrangler secret put`.

### 5. CD (Optional)

Cloudflare Workers Builds, configure it to run:
- **Build Command:** `pnpm run build`
- **Deploy Command:** `pnpm run deploy`
- **Version Command:** `pnpm run upload-version`
- **Root Directory:** `/`

## Roadmap

See [docs/plan.md](docs/plan.md) for the detailed development roadmap and remaining tasks.

## License

[MIT](LICENSE)
