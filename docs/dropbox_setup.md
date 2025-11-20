# Dropbox App Key と Secret の取得方法

OrgDrop で Dropbox と連携するために、Dropbox の App Key と App Secret が必要です。
以下の手順に従って取得してください。

## 1. Dropbox App Console にアクセス
[Dropbox App Console](https://www.dropbox.com/developers/apps) にアクセスし、ログインしてください。

## 2. アプリの作成
1. **"Create app"** ボタンをクリックします。
2. **"Choose an API"** で **"Scoped access"** を選択します。
3. **"Choose the type of access you need"** で以下のいずれかを選択します：
    *   **App folder**: アプリ専用のフォルダ（`/Apps/OrgDrop` など）のみにアクセスできます。安全でおすすめです。
    *   **Full Dropbox**: Dropbox 内のすべてのファイルにアクセスできます。既存の Org ファイルが散らばっている場合はこちらを選択してください。
4. **"Name your app"** にアプリ名を入力します（例: `OrgDrop-YourName`）。※ `Dropbox` という単語は使えない場合があります。
5. **"Create app"** をクリックします。

## 3. 権限（Permissions）の設定
アプリが作成されたら、**"Permissions"** タブに移動し、以下の権限にチェックを入れてください。

*   **Files.metadata.read** (ファイル一覧の取得に必要)
*   **Files.content.read** (ファイルの中身を読むために必要)

チェックを入れたら、下部の **"Submit"** ボタンを押して保存してください。

## 4. Redirect URI の設定
**"Settings"** タブに戻り、**"OAuth 2"** セクションにある **"Redirect URIs"** に以下を追加します。

*   `http://localhost:5173/auth/callback`
*   `http://localhost:8787/auth/callback` (Workerでの処理用、構成により変更の可能性あり)

**"Add"** をクリックして追加してください。

## 5. App Key と App Secret の取得
**"Settings"** タブの **"App key"** と **"App secret"** を確認してください。
"App secret" は **"Show"** をクリックすると表示されます。

これらの値を控えておいてください。
