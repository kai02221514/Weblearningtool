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
