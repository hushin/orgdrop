# OrgDrop - 今後の開発計画

このドキュメントは、OrgDrop プロジェクトの残タスクと今後の開発方針をまとめたものです。

## 残タスク

### 📝 Org-mode パーサーの拡張

- [x] コードブロック（`#+BEGIN_SRC`）のシンタックスハイライト
- [ ] url のパース、リンク化
- [ ] テーブルのパース
- [ ] スケジュール（`SCHEDULED:`）と締切（`DEADLINE:`）のパース
- [ ] 日付 例 `CREATED: [2025-11-20 Thu 08:45]` のパース

### 🔗 リンク機能の拡張
- [ ] 内部リンク（`[[id:xxx]]`, `[[*Heading]]`）のサポート
- [ ] ファイル間リンク（`[[file:other.org]]`）のナビゲーション
### 🔍 検索機能の改善

- [ ] 検索・読み込み除外フォルダの設定
    - .git, journal
- [ ] 検索結果のハイライト表示
- [ ] ファイル名での絞り込み
- [ ] タグ検索

### 🖼️ 画像表示の改善

- [ ] Dropbox 上の画像の表示（現在はローカルパスのみ）
- [ ] 画像の遅延読み込み

### ⚙️ 設定機能
- [ ] `org-todo-keywords` のカスタマイズ UI
- [ ] `DROPBOX_ROOT_PATH` の UI での変更

### 🧪 テスト
- [ ] パーサーの単体テスト拡充
- [ ] UseCase の単体テスト
- [ ] E2E テスト（Playwright など）

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
