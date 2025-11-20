# OrgDrop - 今後の開発計画

このドキュメントは、OrgDrop プロジェクトの残タスクと今後の開発方針をまとめたものです。

## 完了済み機能

### ✅ 基本機能
- Vite + React + TypeScript プロジェクトのセットアップ
- Tailwind CSS の導入
- Org-mode パーサーの実装（見出し、リスト、TODO、リンク、画像）
- Clean Architecture の採用（Domain, UseCase, Repository, UI レイヤー）
- MockFileRepository（ローカルダミーデータ）

### ✅ UI/UX
- サイドバー + メインコンテンツのレイアウト
- レスポンシブデザイン（モバイル対応）
- ハンバーガーメニュー

### ✅ 機能実装
- ファイルブラウザ / ビューア
- 検索機能（全文検索、行番号表示）
- Org Agenda ビュー（TODO タスク一覧）
- 画像レンダリング

### ✅ Dropbox 連携
- Cloudflare Workers プロジェクトのセットアップ
- Dropbox OAuth フローの実装
- Dropbox API クライアントの実装
  - ファイル一覧取得（再帰的、ページネーション対応）
  - ファイルダウンロード
  - ファイル検索
- `DROPBOX_ROOT_PATH` によるフォルダ指定
- 隠しファイル（`.#gtd.org` など）の除外
- RemoteFileRepository の実装とフロントエンドへの統合

---

## 残タスク


### 📝 Org-mode パーサーの拡張
- [ ] テーブルのパース
- [ ] コードブロック（`#+BEGIN_SRC`）のシンタックスハイライト
- [ ] タグ（`:tag:`）のサポート
- [ ] プロパティ（`:PROPERTIES:`）のサポート
- [ ] 優先度（`[#A]`, `[#B]`, `[#C]`）の表示改善
- [ ] スケジュール（`SCHEDULED:`）と締切（`DEADLINE:`）のパース
- [ ] 繰り返しタスク（`+1w`, `.+1d` など）のサポート

### 📅 Agenda 機能の強化


- [ ] org-agenda-files 相当のサポート

```
  (setq my-default-org-agenda-files
    (append
      (directory-files org-directory t "\\.org$")
      (directory-files-recursively (concat org-roam-directory "areas") "\\.org$")
      (directory-files-recursively (concat org-roam-directory "projects") "\\.org$")
      (directory-files-recursively (concat org-roam-directory "resources") "\\.org$")))

  (setq org-agenda-files my-default-org-agenda-files)
```

- [ ] 日付フィルタリング（今日、今週、今月）
- [ ] TODO ステータスのフィルタリング
- [ ] 優先度順のソート
- [ ] カレンダービュー
- [ ] `SCHEDULED` と `DEADLINE` の表示

### 🔍 検索機能の改善

- [ ] 検索・読み込み除外フォルダの設定
    - .git, journal
- [ ] 検索結果のハイライト表示
- [ ] ファイル名での絞り込み
- [ ] タグ検索
- [ ] 日付範囲検索

### 🖼️ 画像表示の改善
- [ ] Dropbox 上の画像の表示（現在はローカルパスのみ）
- [ ] 画像の遅延読み込み

### 🔗 リンク機能の拡張
- [ ] 内部リンク（`[[id:xxx]]`, `[[*Heading]]`）のサポート
- [ ] ファイル間リンク（`[[file:other.org]]`）のナビゲーション
- [ ] リンクのプレビュー

### ⚙️ 設定機能
- [ ] `org-todo-keywords` のカスタマイズ UI
- [ ] `DROPBOX_ROOT_PATH` の UI での変更

### 🚀 パフォーマンス最適化

- [ ] キャッシュ戦略（Dropbox API のレスポンスキャッシュ）
    - [ ] 初回 Cloudflare Workers KV へのキャッシュ、以降は Dropboxファイルが更新されていなければキャッシュを使用する

### 🧪 テスト
- [ ] パーサーの単体テスト拡充
- [ ] UseCase の単体テスト
- [ ] E2E テスト（Playwright など）

### 📦 デプロイ
- [ ] Cloudflare Workers へのデプロイ設定
- [ ] Cloudflare Pages へのフロントエンドデプロイ
- [ ] 本番環境用の環境変数設定
- [ ] CI/CD パイプラインの構築

### 📚 ドキュメント
- [ ] README の充実（セットアップ手順、使い方）
- [ ] Dropbox App の作成手順（`docs/dropbox_setup.md` は作成済み）
- [ ] アーキテクチャドキュメント
- [ ] コントリビューションガイド

---

## 技術的な課題

### Dropbox API の制限
- API レート制限に注意（特に検索機能）
- 大量のファイルがある場合のページネーション処理（実装済み）

### Org-mode の複雑さ
- Org-mode の仕様は非常に広範囲
- すべてをサポートするのは現実的ではない
- 実用的な機能に絞って実装する方針

### パフォーマンス
- 大きな Org ファイル（数千行）のパースが遅い可能性
- 仮想スクロールやキャッシュ戦略が必要

---

## 参考リンク

- [Org-mode 公式ドキュメント](https://orgmode.org/manual/)
- [Dropbox API ドキュメント](https://www.dropbox.com/developers/documentation)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
