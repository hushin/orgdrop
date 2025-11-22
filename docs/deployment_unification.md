# Cloudflare Workers 統合デプロイガイド

現在、Frontend (`apps/web`) と Backend (`apps/worker`) に分かれている構成を、1つの Cloudflare Worker として統合し、デプロイ構成を簡素化する方法をまとめます。

Cloudflare Workers の **Static Assets (Assets Binding)** 機能を利用することで、1つの Worker で静的ファイル（Frontend）の配信と、API ロジック（Backend）の実行の両方を行うことができます。

## 概要

- **変更前**:
  - `apps/web`: Pages または Static Worker としてデプロイ
  - `apps/worker`: API Worker としてデプロイ
  - 2つのデプロイフロー、CORS設定が必要

- **変更後**:
  - `apps/web`: 統合 Worker としてデプロイ
  - Frontend ビルド成果物は `assets` として配信
  - Backend ロジックは同 Worker 内の `main` スクリプトとして実行 (`/api/*` を処理)
  - 1つの `wrangler.jsonc`、1回の `wrangler deploy` で完結
  - 同一オリジンのため CORS 不要

---

## 手順

### 1. 依存関係のインストール

`apps/web` に Backend で使用しているライブラリを追加します。

```bash
cd apps/web
pnpm add hono
# その他、workerで使用しているライブラリがあれば追加 (例: cookieなど)
# pnpm add -D @cloudflare/workers-types
```

### 2. Backend コードの移行

`apps/worker/src` の内容を `apps/web` 内の新しいディレクトリ（例: `worker`）にコピーします。

```text
apps/web/
  ├── src/
  │   ├── ... (Frontend code)
  ├── worker/           <-- 新規作成
  │   ├── index.ts      <-- apps/worker/src/index.ts を移動・修正
  │   ├── dropbox.ts    <-- コピー
  │   ├── file-cache.ts <-- コピー
  │   └── utils.ts      <-- コピー
```

### 3. Worker エントリーポイントの修正 (`apps/web/worker/index.ts`)

Worker が API リクエストを処理し、それ以外を静的アセット（Frontend）に流すように修正します。

```typescript
import { Hono } from 'hono';
// ... 他のインポート

interface Env {
    // ... 既存の環境変数定義
    ASSETS: Fetcher; // Static Assets 用のバインディング
}

const app = new Hono<{ Bindings: Env }>();

// CORS は同一オリジンになるため、基本的には不要になりますが、
// 開発環境などで必要な場合は残しても構いません。

// API ルートの定義 (既存のロジック)
app.get('/api/files', ...);
app.get('/api/agenda', ...);
// ...

// 認証コールバックの修正
// redirectUri は現在のオリジン (例: https://orgdrop.user.workers.dev/auth/callback) になります。
// WORKER_URL 環境変数は不要になり、c.req.url からオリジンを取得可能です。

// ★重要: API 以外のリクエストを Static Assets にフォールバックさせる
app.get('*', async (c) => {
    return await c.env.ASSETS.fetch(c.req.raw);
});

export default app;
```

### 4. Wrangler 設定の統合 (`apps/web/wrangler.jsonc`)

`apps/web/wrangler.jsonc` に Worker (`main`) の設定と、KV などのリソース設定を追加します。

```jsonc
{
    "name": "orgdrop", // 名前は適宜変更
    "compatibility_date": "2025-11-22",
    
    // Static Assets の設定 (既存)
    "assets": {
        "directory": "./dist",
        "not_found_handling": "single-page-application"
    },

    // Worker ロジックのエントリーポイントを追加
    "main": "worker/index.ts",

    // Backend から KV 設定をコピー
    "kv_namespaces": [
        {
            "binding": "DROPBOX_CACHE",
            "id": "a30b3ff828464016aaf55d9696c28783"
        }
    ],

    // 環境変数
    "vars": {
        // FRONTEND_URL, WORKER_URL は統合されるため基本不要ですが、
        // Dropbox Auth の Redirect URI 生成などで使用している場合は調整してください。
        // 統合後は window.location.origin が Frontend/Backend 共通の URL になります。
    }
}
```

### 5. Frontend コードの修正

Frontend からの API 呼び出しを相対パスに変更します。

**変更前:**
```typescript
const WORKER_URL = import.meta.env.VITE_WORKER_URL;
fetch(`${WORKER_URL}/api/files`)
```

**変更後:**
```typescript
// 同一オリジンなので相対パスでOK
fetch('/api/files')
```

### 6. 型定義の調整

`apps/web/tsconfig.json` (または `tsconfig.app.json` / `tsconfig.node.json`) に `worker` ディレクトリを含めるか、`worker` 用の `tsconfig.worker.json` を作成して、Worker ランタイムの型定義 (`@cloudflare/workers-types`) が適用されるようにします。

### 7. デプロイ

`apps/web` ディレクトリでビルドとデプロイを実行します。

```bash
# Frontend のビルド
pnpm build

# Cloudflare へのデプロイ (Assets + Worker)
pnpm deploy
```

これで、1つの Worker URL でアプリ全体が動作するようになります。
