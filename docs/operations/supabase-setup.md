# Supabase Setup

## 前提

- 対象Project Reference ID: `znfwkrhquegvlcmugkoe`
- Project URL: `https://znfwkrhquegvlcmugkoe.supabase.co`
- 用途: D-023で正式指定した**合成データ専用の非本番remote検証環境**
- 禁止データ: 実在個人情報、研究参加者データ、本番データ
- Supabase CLIを利用できること
- Supabase DashboardでPublishable keyを取得できること
- Secret key、service_role key、JWT secretをフロントエンド環境変数へ置かないこと

## 現在の指定remote状態（2026-09-07）

- Organization `httvbvgmiboypecuoyqy`のplanは`free`である。D-024により当面はFreeプランを継続する
- KAI-34で実行基準main `22ca66d662067b639c33912e41bab3a81ee78c2d`に固定した3 migrationを適用済みである
- public tableはRLS有効な`profiles`と`user_diagnoses`で、旧`kv_store_f3d88633`は不存在である
- Edge Function `make-server-f3d88633`はversion 5、ACTIVE、`verify_jwt=false`、artifact SHA-256 `caec2a968e3899ce06fb482af6f43bd824ec93877afac574c5c2213395be7c77`である
- 合成A/B・未認証・無効token・signup失敗境界を検証し、作成したAuth user、profiles、diagnosesは0件へcleanup済みである
- rollbackは実施していない。適用前version 4と既知hash、最小互換KV rollback候補を追加許可が必要な復旧候補として維持する
- 詳細な適用版、時刻、metadata差分、HTTP status、Advisor分類は`docs/operations/kai-34-remote-application-plan.md`を正とする

## Auth leaked-password protectionの既知リスク（D-024）

- 2026-09-07確認時点で、Supabase公式[Password security](https://supabase.com/docs/guides/auth/password-security)はleaked-password protectionをPro Plan以上としており、公式[Pricing](https://supabase.com/pricing)ではFreeに含まれない
- D-024のFreeプラン継続判断により、KAI-35ではleaked-password protectionを有効化しない。Proへの変更、課金、請求設定、独自のHave I Been Pwned連携またはpassword blocklistも行わない
- `password_hibp_enabled`は未変更で、機能は未提供・未有効化・未検証である。Security Advisorの`auth_leaked_password_protection`警告を誤検知または解消済みと扱わない
- KAI-35の既知漏えいpassword拒否、妥当なpassword受付、既存利用者への影響、rollbackに関する元受入条件は未達であり、KAI-35をDoneとしない
- Free継続は合成データ専用非本番環境での利用に限る。実在個人情報・研究参加者データ・本番データを投入しない
- OrganizationをPro以上へ変更する場合、Supabaseの提供条件が変わった場合、別の漏えいpassword対策を検討する場合、または実在参加者利用・予備試行・研究データ収集・本番化の前に認証セキュリティを再判断する
- KAI-35をCanceled／Won't Do相当へ移すかBacklogで維持するか、Free継続期間、その他のpassword policy強化は未確定である

## Remote変更の許可境界（D-023）

このprojectへのmigration適用とEdge Function deployは、次の条件をすべて満たす変更だけに許可する。

1. schema、migration、FunctionがGit管理されている。
2. fresh local環境とCIで、対象Issueの受入条件に対応する検証が成功している。
3. Draft PRの差分、review thread、対象外、rollbackが監査されている。
4. 対象project ref、変更内容、適用版について研究者本人の明示許可がある。
5. KAI-33でremote KVの行数・利用箇所・停止条件を再確認済みである。KVにデータが存在する場合は、自動移行・削除を行わず停止する。

研究者本人はD-023とその確定契約に基づくKAI-32〜KAI-35の着手判断を指導教員から委任されていると明示しており、この範囲では追加の指導教員承認を開始条件としない。これは指導教員がD-023の技術内容を個別に確認・承認済みであることやremote変更への包括許可を意味せず、上記4の変更ごとの明示許可を置き換えない。

Dashboard上の手作業やad hoc SQLで、Git管理外のschema差分を作らない。RLS policyとPostgres GRANTは別レイヤーであり、片方だけを確認済みとして扱わない。service roleまたはsecret keyはbackendだけで扱い、frontend、配布物、source、検証記録へ公開しない。

### Deploy前確認

- `project ref = znfwkrhquegvlcmugkoe`であり、本番projectでない。
- remote migration履歴とrepository migrationの差分、対象table、RLS有効性、operation別policy、`anon`・`authenticated`・`service_role`のGRANTを確認する。
- 現在のEdge Function versionと、deployするGit commit・artifactを照合する。
- 実在個人情報・研究参加者データがないことと、合成利用者の識別方法を確認する。
- 逆向きmigration、直前Function version、停止判定、復旧確認を含むrollback方法を用意する。

### Deploy後確認

- migration履歴、table、RLS、policy、GRANT、Function versionが監査済み計画と一致する。
- 合成利用者A/Bと未認証要求で、本人read/write成功、他人read/write拒否、未認証拒否を確認する。
- signupから表示名load/update、D-022診断保存、明示的再ログイン後復元までを確認する。
- signup後段の失敗時に、孤立Auth userまたは利用可能な不完全accountを残さないことを確認する。
- Security AdvisorとPerformance Advisorを取得し、警告、判断、未解消事項をPRまたはIssueへ記録する。

### Rollback

異常、計画外差分、停止条件、境界テスト失敗があれば追加変更を止め、事前定義した逆向きmigrationと直前の監査済みFunction versionへ戻す。rollback後もmigration履歴、RLS、GRANT、Function version、合成利用者境界を再確認し、実行時刻と結果を記録する。

この許可はKAI-34等の独立Issueに限って適用する。実在参加者データ、研究データ収集、予備試行、同意、保持、撤回・削除、本人対応表、研究者access/export、評価ログ、学内手続、KAI-12/OQ-009の残余、KAI-16の許可を意味しない。

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
npx supabase functions deploy make-server-f3d88633 \
  --project-ref znfwkrhquegvlcmugkoe
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
- `display-name`と`diagnosis`はアプリ内で`Authorization: Bearer <access token>`を検証する。
- D-023で不採用となった5項目用legacy `/profile`とKV helperはKAI-33 / PR #45でrepository mainから撤去し、KAI-34で指定remoteへ反映済みである。remoteではlegacy `/profile` 404、旧KV不存在、表示名・診断の本人境界を確認済みである。適用結果とrollback候補は`docs/operations/kai-34-remote-application-plan.md`を参照する。
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
