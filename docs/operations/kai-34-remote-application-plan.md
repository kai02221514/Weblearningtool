# KAI-34 remote適用・統合検証記録

## 状態と境界

- 状態: 2026-09-07に監査済み3 migrationとEdge Functionを指定remoteへ適用し、合成データ統合検証・cleanup・Advisor取得まで完了。Draft PR監査前であり、KAI-34はIn Progressを維持する
- 対象project ref: `znfwkrhquegvlcmugkoe`（`WebLearningTools`、合成データ専用非本番remote検証環境）
- KAI-33開始基準main: `68f50a2784073a09c7733fc9171a94dc942da597`
- KAI-33 final head: `aaec41177e35cd30190b8b57ed65c4e4aafe9510`
- KAI-33 merge commit: `f7bf8c86ebae8e23c7c8ddb9aa9fbb43bf8b1246`
- Function変更候補commit: KAI-34開始時の最新mainから、PR #45 final headを含む監査対象commitへ再固定する
- remote rollback先: Edge Function `make-server-f3d88633` version 4、bundle SHA-256 `9494c89b52f9e9994e7c7098bad6462dc835a2f7ce16965d52ee5ffb490a6c58`
- 禁止: KAI-33でのremote migration、deploy、削除、更新、設定変更。実在個人情報・研究参加者データの利用

## 2026-09-07 KAI-34実行結果

### 適用元と許可

- 実行基準main・適用元commit: `22ca66d662067b639c33912e41bab3a81ee78c2d`
- forward migration:
  - `20260905104859_create_user_diagnoses.sql` / Git blob `17adce8bed9cb7b917dd417e885347151afbfb33`
  - `20260906111009_create_profiles.sql` / Git blob `4db19406bccd3580925622b6c8bf8ef7d586f72b`
  - `20260906132827_drop_legacy_kv_store.sql` / Git blob `adc7312c0a8661e7c6668e76d3ec1d13ada11751`
- remote履歴対応のみ: `20251204051132_create_kv_table_f3d88633.sql` / Git blob `ade8bc4306c1edc59d1b4d6ccaecd37670e0bcdd`。再適用・履歴repairは行っていない
- Function: `supabase/functions/make-server-f3d88633/index.ts` / Git blob `6703f07499e17b64118a244095b917d57bef7de5`。`verify_jwt=false`を維持した
- 許可確認時刻: 2026-09-06T15:26:49Z（2026-09-07T00:26:49+09:00）
- 研究者本人の許可文: 「上記preflight結果を確認しました。列挙されたproject、適用版、3 migration、Function deploy、verify_jwt=falseの維持、合成データの作成・境界試験・削除、適用後metadata／Advisor取得、短い利用停止境界を含むKAI-34のremote変更を許可します。」

### 適用直前preflight

- project ref `znfwkrhquegvlcmugkoe`、名称`WebLearningTools`、region `ap-northeast-1`、status `ACTIVE_HEALTHY`、Postgres `17.6.1.127`を再確認した
- remote migration履歴は`20251204051132_create_kv_table_f3d88633`だけだった
- KVの値なし正確集計はtotal 0 / `user:` 0 / `profile:` 0 / その他0だった。key、value、個別行は取得していない
- Edge Functionはversion 4、ACTIVE、`verify_jwt=false`、bundle SHA-256 `9494c89b52f9e9994e7c7098bad6462dc835a2f7ce16965d52ee5ffb490a6c58`で、監査値から変化していなかった
- `supabase db push --dry-run --linked`が表示したpending migrationは上記3件だけだった。seed、role、履歴repair、resetは含めていない

### Forward適用

| 操作 | UTC | JST | 結果 |
| --- | --- | --- | --- |
| migration適用 | 2026-09-06T15:27:09Z〜15:27:10Z | 2026-09-07T00:27:09+09:00〜00:27:10+09:00 | 指定3件を履歴順に適用成功 |
| Function deploy | 2026-09-06T15:27:24Z〜15:27:28Z | 2026-09-07T00:27:24+09:00〜00:27:28+09:00 | `make-server-f3d88633`だけをdeploy成功 |

migration開始からFunction deploy完了まで外部検証要求を入れず、短い利用停止境界として扱った。CLIはFunction deploy時にdecorator設定をflagで指定しないよう求める警告を出したが、deployは成功し、`verify_jwt=false`はdeploy後metadataで再確認した。secret、project設定、Auth設定は変更していない。

### Deploy後metadata

- migration履歴は旧履歴対応1件とforward 3件の計4件で、予定外migrationはない
- public tableは`profiles`と`user_diagnoses`だけで、旧KV tableと4 indexは不存在である
- 両tableはRLS有効・force RLS無効で、`authenticated`本人に限定したSELECT / INSERT / UPDATE policyが各3件ある
- `profiles`はauthenticatedに列限定SELECT、`id`・`display_name`のINSERT、`display_name`のUPDATEだけを許可し、service_roleにはtable SELECT / DELETEを許可する。anonとPUBLICのtable権限はない
- `user_diagnoses`はauthenticatedにSELECT / INSERT / UPDATEだけを許可し、anonとPUBLICのtable権限はない。RLSとGRANTを別レイヤーで照合した
- indexは各tableのPK index 1件ずつである。`profiles.id`は`auth.users(id) on delete cascade`を参照する
- public routineは4件で、ownerはすべて`postgres`。`handle_new_auth_user_profile`だけSECURITY DEFINER、他3件はSECURITY INVOKERである。`handle_new_auth_user_profile`、`set_profile_timestamps`、`strip_profile_bootstrap_metadata`のEXECUTEは`postgres`だけ、`set_user_diagnosis_timestamps`は`postgres`と`service_role`だけである
- Edge Functionはversion 5、ACTIVE、`verify_jwt=false`、deploy artifact SHA-256 `caec2a968e3899ce06fb482af6f43bd824ec93877afac574c5c2213395be7c77`である。deployされたindex、diagnosis shared、profile sharedの内容はGit版と完全一致した

### 合成利用者統合検証

実行時間は2026-09-06T15:31:11Z〜15:31:26Z（2026-09-07T00:31:11+09:00〜00:31:26+09:00）。`.invalid` email、ランダムな強いpassword、合成表示名だけを使用し、email全文、password、token、UUID全文、個人単位responseを証跡へ保存していない。

| 境界 | status・結果 |
| --- | --- |
| 不正表示名のsignup前拒否 | 400、Auth user 0 |
| A/B signup・signin | 200、profile成立、Auth metadataに表示名なし |
| 表示名load・update | 200 |
| D-022診断save・load・update | 200 |
| 明示的再ログイン後の表示名・診断復元 | 200、復元一致 |
| 未認証・無効token | display-name / diagnosisとも401 |
| request指定owner ID | query / bodyとも400 |
| BからAへのRLS read / update | 200＋空配列。権限エラーではなく行不可視境界として確認 |
| BからAへの診断INSERT | 403 |
| anon Data API read | profiles / diagnosesとも401 |
| 保護列UPDATE、authenticated DELETE | 403 |
| legacy `/profile` | 404 |
| profile欠損account | signin 409で利用不可 |
| profile trigger失敗 | 500、孤立Auth user 0、同email修正後再試行200 |
| Auth user削除によるprofile連動削除 | profile 0行 |

検証終了時に作成した合成Auth userをすべて削除し、対象ID集合に対するAuth user、profiles、diagnosesが0件であることを確認した。独立したtable全体件数確認でもprofiles 0 / diagnoses 0だった。他データは変更していない。

### Advisorとrollback

- Security Advisor新規警告: `pg_graphql_authenticated_table_exposed`がprofilesとuser_diagnosesに各1件。authenticated本人のData API readに必要な意図的SELECT GRANTによるschema可視性警告であり、他人readはRLSにより200＋空配列、anon readは401であることを実測した。schema可視性自体は警告どおりだが、KAI-34の本人アクセス契約に対する重大な未解消脆弱性とは分類しない
- Security Advisor既存警告: `auth_leaked_password_protection` 1件。KAI-35の対象であり、本Issueでは設定変更していない
- Performance Advisor: 0件
- rollback: 不要と判断し、実施していない。旧Function version 4と既知hash、最小互換KV rollback候補は異常時の追加許可対象として維持する

すべての確認は合成データ専用非本番環境の技術的統合検証に限定する。実在個人情報・研究参加者データは使用しておらず、参加者評価や研究上の有効性主張へ一般化しない。新しい研究判断はないためDecision Logは更新しない。

## 2026-09-06 read-only再確認

最初の正確な集計ではKVが合計1件（`user:` 1、`profile:` 0、その他0）だったため、内容を取得せず停止した。研究者本人から削除完了の連絡を受けた後、同一project refで集計だけを再実行し、合計0件（全区分0）を確認した。個別key、value、email、name、createdAt、age、occupation、pace、level、levelScoreは取得していない。

| 対象 | remote再確認結果 | KAI-33 repository候補 | KAI-34での扱い |
| --- | --- | --- | --- |
| migration履歴 | `20251204051132_create_kv_table_f3d88633`のみ | 同version/nameの履歴整合ファイル、D-022、profiles、KV撤去 | dry-runで履歴対応を再確認後、順番どおり適用 |
| public table | `kv_store_f3d88633`のみ | `user_diagnoses`、`profiles`。KVは最終状態で不存在 | migration後に3対象を再取得 |
| KV列・制約 | `key text not null` PK、`value jsonb not null` | 履歴整合migrationで再現後、安全停止migrationで撤去 | 適用直前に正確な件数を再集計 |
| RLS / policy | KVはRLS有効、force RLS無効、policy 0 | diagnoses / profilesに本人限定policy。KVなし | RLSとpolicyを別々に照合 |
| GRANT | KVはanon / authenticated / service_roleに7種類のtable権限 | profiles / diagnosesは明示最小権限。KV権限はtableとともに消滅 | RLSとGRANTを別レイヤーで照合 |
| index | KV PKに加え、同一`key text_pattern_ops` indexが3件 | KV撤去により4 indexとも消滅 | 重複indexだけを単独操作しない |
| public routine | 0件 | diagnoses 1関数、profiles 3関数 | owner、security、EXECUTE権限を照合 |
| Edge Function | version 4、ACTIVE、`verify_jwt=false` | legacy `/profile`とKV helperを撤去。signup/signin/display-name/diagnosisは維持 | migration後に監査済みcommitをdeploy |

一覧APIの推定行数0と最初の正確な集計1は一致しなかった。停止判定には必ずDBの正確な集計を用い、推定行数を代用しない。

## 適用候補と順序

KAI-34では、KAI-33のLinear Done、開始時のread-only再確認、PR監査、両CI成功、対象project ref・変更内容・適用対象commitに対する研究者本人の明示許可後だけ実行する。KAI-33に対するmerge許可はKAI-34のremote変更許可へ流用しない。

1. project ref、migration履歴、Function version/hashを再取得し、KVを値なしの4区分集計で再確認する。合計が0以外なら停止する。
2. `supabase db push --dry-run`で次のpending migrationだけが表示されることを確認する。
   - `20260905104859_create_user_diagnoses.sql`
   - `20260906111009_create_profiles.sql`
   - `20260906132827_drop_legacy_kv_store.sql`
3. remote履歴の`20251204051132`とrepositoryの同version/nameが対応することを確認する。履歴repairは行わない。
4. 利用を停止した時間帯に監査済み3 migrationを順番どおり適用する。最後のmigrationはKVに1行でもあれば例外で停止し、tableを残す。
5. migration成功後、監査済みfinal headの`make-server-f3d88633`をdeployする。この短い間、旧version 4のlegacy `/profile`はKV不存在により利用不可となるため、外部要求を入れない。
6. migration履歴、table、column、constraint、RLS、policy、GRANT、index、routine、Function version/hashを再取得する。
7. 合成利用者A/Bと未認証要求だけで、signup、signin、display-name read/update、診断save/load、他人拒否、legacy `/profile` 404を確認する。
8. Security Advisor / Performance Advisorを取得し、警告と判断をKAI-34へ記録する。

`supabase db push`またはFunction deployはKAI-33では実行しない。CLIが予定外migration、履歴repair、seed、role変更を要求した場合も停止する。

## 停止条件

- project ref不一致、remoteアクセス不能、read-only確認不足
- KV合計が1件以上、または区分集計以外の行内容が必要になった場合
- migration履歴、Function version/hash、PR final headが監査値から変化
- dry-runに予定外migration、seed、role変更、履歴repairが含まれる
- 実在個人情報・研究参加者データの兆候
- migration、RLS、GRANT、API境界、Advisorに想定外の差分または失敗

## Rollback候補

schema rollbackを先に実行してKV tableを復元し、その後にEdge Function version 4（上記bundle SHA-256）をredeployする。version番号だけでなくbundle hashも照合する。

逆向きmigrationは次の構造を作る。旧Functionが必要とするservice-role DMLだけを戻し、不要なanon/authenticated権限と3重indexは戻さない。旧データは復元しない。

```sql
create table public.kv_store_f3d88633 (
  key text primary key,
  value jsonb not null
);
alter table public.kv_store_f3d88633 enable row level security;
revoke all on table public.kv_store_f3d88633
  from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.kv_store_f3d88633
  to service_role;
create index kv_store_f3d88633_key_idx
  on public.kv_store_f3d88633 using btree (key text_pattern_ops);
```

この逆向きmigrationはlocalで、RLS有効、PK＋prefix indexの2 index、service_role DML可、anon/authenticated SELECT不可を確認済みである。初回確認はコマンドの改行引用ミスでSQL実行前に失敗し、1行SQLへ修正した再実行が成功した。

diagnoses / profilesまで戻す場合は、追加の逆向きmigrationで依存順にtrigger、function、policy、tableを削除する。`profiles`削除は表示名正本を失うため、合成利用者を削除できること、旧Function version 4へ戻せること、KV最小互換tableを先に復元したことを必須とする。remote migration historyを直接repairしてrollback扱いにしない。rollback後もmigration履歴、RLS、policy、GRANT、index、Function version/hash、合成利用者境界を再確認する。

## 研究境界

5項目を移行・保存対象へ採用していない。新しい研究判断はないためDecision Logは更新しない。OQ-009/KAI-12、KAI-16、同意、保持、撤回・削除要求、本人対応表、研究者access/export、評価ログ、実参加者利用は対象外である。
