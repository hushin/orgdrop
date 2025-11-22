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

1.  Start the Backend (Worker):
    ```bash
    cd apps/worker
    pnpm run dev
    ```

2.  Start the Frontend (in a separate terminal):
    ```bash
    cd apps/web
    pnpm run dev
    ```

3.  Open your browser at `http://localhost:5173`.

## Roadmap

See [docs/plan.md](docs/plan.md) for the detailed development roadmap and remaining tasks.

## License

[MIT](LICENSE)
