# KAI-34 remote適用候補

## 状態と境界

- 状態: KAI-33で作成した監査候補。remote未適用
- 対象project ref: `znfwkrhquegvlcmugkoe`（`WebLearningTools`、合成データ専用非本番remote検証環境）
- KAI-33開始基準main: `68f50a2784073a09c7733fc9171a94dc942da597`
- Function変更候補commit: `b4211f9`（Draft PRのfinal headへ更新された場合はKAI-34開始時に再固定する）
- remote rollback先: Edge Function `make-server-f3d88633` version 4、bundle SHA-256 `9494c89b52f9e9994e7c7098bad6462dc835a2f7ce16965d52ee5ffb490a6c58`
- 禁止: KAI-33でのremote migration、deploy、削除、更新、設定変更。実在個人情報・研究参加者データの利用

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

KAI-34では、PR監査、両CI成功、対象project ref・変更内容・final headに対する研究者本人の明示許可後だけ実行する。

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
