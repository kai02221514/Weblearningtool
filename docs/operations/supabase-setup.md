# Supabase Setup

## 前提

- 対象Project Reference ID: `znfwkrhquegvlcmugkoe`
- Project URL: `https://znfwkrhquegvlcmugkoe.supabase.co`
- Supabase CLIを利用できること
- Supabase DashboardでPublishable keyを取得できること
- Secret key、service_role key、JWT secretをフロントエンド環境変数へ置かないこと

## ローカル設定

`.env.example` をコピーして `.env.local` を作成する。

```sh
cp .env.example .env.local
```

`.env.local` に以下を設定する。値はコミットしない。

```sh
VITE_SUPABASE_URL=https://znfwkrhquegvlcmugkoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<Supabase Dashboardで取得したPublishable key>
VITE_SUPABASE_FUNCTION_NAME=make-server-f3d88633
```

`VITE_SUPABASE_PUBLISHABLE_KEY` 以外の秘密情報をブラウザへ露出させない。

## Supabase CLI

ログインする。

```sh
npx supabase login
```

プロジェクトを接続する。

```sh
npx supabase link --project-ref znfwkrhquegvlcmugkoe
```

Edge Functionをデプロイする。

```sh
npx supabase functions deploy make-server-f3d88633
```

実行環境で通常のデプロイが使えない場合のみ、Supabase CLIの案内に従って以下を検討する。

```sh
npx supabase functions deploy make-server-f3d88633 --use-api
```

## Supabase MCP

Supabase MCPは、CodexがSupabaseの公式文書と現在の構造を確認するためだけに使用する。接続先はProject名ではなくProject Reference IDで識別し、`znfwkrhquegvlcmugkoe`だけに限定する。

リポジトリ固有の`.codex/config.toml`では、次の制約を併用する。

- URLに`project_ref=znfwkrhquegvlcmugkoe`、`read_only=true`、`features=database,docs`を指定する。
- Codex側の`enabled_tools`は`search_docs`、`list_tables`、`list_extensions`、`list_migrations`の4読取ツールだけに限定する。
- server既定の`default_tools_approval_mode = "prompt"`に加え、4読取ツールそれぞれへ`approval_mode = "prompt"`を明示する。
- 2026-07-12のCodex CLI `0.144.0-alpha.4`による対話型試験では、server既定と個別ツール設定のどちらでもCodexのツール承認UIが表示されず、`list_tables`が実行された。そのため現在は`enabled = false`とし、手動承認UIを実環境で確認できるまで正式運用しない。
- OAuth認証は通常のターミナルから`codex mcp login supabase`で行い、OAuth token、PAT、API key、Authorization header等の認証情報をリポジトリへ保存しない。

将来、ユーザーがツール呼び出し内容を確認して承認または拒否できるCodexの承認UIが、実際の`list_tables`実行前に表示されることを対話型セッションで確認できた場合に限り、`enabled = true`への変更を別途レビューする。モデルが会話文で確認を求めるだけの挙動は、Codexのツール承認UIの確認として扱わない。`approval_policy = "never"`、`approvals_reviewer = "auto_review"`、`codex exec`等の非対話モード、`--dangerously-bypass-approvals-and-sandbox`を使用したセッションでは検証・運用しない。

有効化後もMCPで許可する確認範囲は、公式文書、テーブル定義・RLS状態・行数等のコンパクトなメタデータ、extension一覧、migration履歴一覧に限る。行データを取得せず、SQL実行、migration適用、Auth、Storage、Edge Function、ログ、project/account管理を取得・操作しない。DBの現況やMCPの結果から、OQ-009の保存項目、保持期間、削除手順、アクセス権限、同意、評価ログ仕様を確定しない。

Supabase Dashboardでは対象の`main`が`PRODUCTION`と表示されている。2026-07-12時点で対象テーブルが空であることは、将来の永続的な安全保証ではない。氏名、メールアドレス、診断回答、学習履歴、アンケート、同意状態、評価ログ等の研究参加者または実利用者データを投入する前に、`.codex/config.toml`のSupabase設定を`enabled = false`へ変更するか、接続先を専用の非本番Supabaseプロジェクトへ移行する。これらのデータが存在する環境では本MCPを使用しない。

設定を停止またはロールバックする場合は、`enabled = false`へ変更するか、`.codex/config.toml`の`[mcp_servers.supabase]`セクションを削除する。設定差分はtrusted projectの境界に影響するため、`main`へマージする前にレビューする。

## Function設定

`supabase/config.toml` では `make-server-f3d88633` に対して `verify_jwt = false` を設定している。

- `signup`、`signin`、`health` を未認証で呼び出すための暫定設定である。
- `profile` はアプリ内で `Authorization: Bearer <access token>` を検証する。
- 本番運用時にはレート制限、公開範囲、CORS制限を再検討する。

## Health確認

```sh
curl -i \
  https://znfwkrhquegvlcmugkoe.supabase.co/functions/v1/make-server-f3d88633/health
```

期待値:

```json
{"status":"ok"}
```

## フロントエンド起動

```sh
npm install
npm run dev
```
