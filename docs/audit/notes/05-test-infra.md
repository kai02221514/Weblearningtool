# 監査ノート 05: テスト・ビルド基盤

- 対象: kai02221514/Weblearningtool (main, HEAD: 16d2f93)
- 調査日: 2026-07-02
- 調査方法: GitHub raw / API 経由の読み取りのみ(コード変更なし)
- 参照API:
  - ファイル一覧: `https://api.github.com/repos/kai02221514/Weblearningtool/git/trees/main?recursive=1`(`"truncated":false` を確認済み=全ファイル網羅)
  - ブランチ: `https://api.github.com/repos/kai02221514/Weblearningtool/branches`
  - コミット: `https://api.github.com/repos/kai02221514/Weblearningtool/commits?sha=main&per_page=5`

---

## 1. package.json の scripts と依存関係

### 実態
- scripts は **dev と build の2つのみ**。test / lint / typecheck / preview は一切存在しない。
- devDependencies は3パッケージのみ: `@types/node@^20.10.0`, `@vitejs/plugin-react-swc@^3.10.2`, `vite@6.3.5`。
- **TypeScript 本体(`typescript`)が devDependencies に無い**。ソースは全て .ts/.tsx なのに、コンパイラが依存宣言されていない。
- テストフレームワーク(vitest / jest 等)、ESLint、Prettier はいずれも依存に無い。
- dependencies は42パッケージ。Radix UI 27パッケージ、shadcn/ui 系ユーティリティ(cva, clsx, tailwind-merge)、recharts, embla-carousel-react, react-day-picker, input-otp, vaul, cmdk, sonner, next-themes, react-hook-form, react-resizable-panels, lucide-react、Supabase 2系統(`@supabase/supabase-js` と JSR 版 `@jsr/supabase__supabase-js`)、サーバFW の `hono`。

### 根拠 (package.json)
```json
"scripts": {
    "dev": "vite",
    "build": "vite build"
}
```
```json
"devDependencies": {
    "@types/node": "^20.10.0",
    "@vitejs/plugin-react-swc": "^3.10.2",
    "vite": "6.3.5"
}
```

### 問題
- `npm test` に相当するものが定義できない = 検証コマンドがリポジトリに1つも存在しない。
- **パッケージ名 `"name": "Web Learning Tool"` は npm の命名規則違反**(空白・大文字を含む)。`npm install` が "Invalid name" で失敗する環境がある。再現性のあるビルドの前提が崩れている。
- `"clsx": "*"`, `"hono": "*"`, `"tailwind-merge": "*"` とワイルドカード指定があり、かつ `.gitignore` で `/package-lock.json` を除外しているため(後述)、**インストールごとに依存バージョンが変わり得る**。トレーサビリティ(いつ・どのバージョンで動いたか)が担保できない。
- Supabase クライアントが npm 版と JSR 版で二重に依存宣言されている。
- フロントエンド用 package.json に Supabase Edge Function 用の `hono` が混入(サーバコードが `src/supabase/functions/` 配下にあるため)。

---

## 2. tsconfig.json の有無と型検査の実行可能性

### 実態
- **tsconfig.json は存在しない**。git trees API のルート直下は `.gitignore`, `.npmrc`, `README.md`, `index.html`, `package.json`, `vite.config.ts`, `docs/`, `src/` のみ(`"truncated":false`)。サブディレクトリにも tsconfig 系ファイルは無い。
- `typescript` パッケージも未宣言(項目1参照)のため、`tsc --noEmit` は**設定・ツールの両面で実行不可能**。

### 根拠
- ファイル一覧APIの全93エントリ中に `tsconfig` を含むパスが存在しない。
- vite.config.ts はプラグインに `@vitejs/plugin-react-swc` を使用。SWC(および vite 内部の esbuild)は**型情報を削除して変換するだけで型検査を行わない**。つまり `npm run build` が成功しても型エラーの不在は何も保証しない。

### 問題
- 型注釈は書かれているが検査されない「見かけだけの TypeScript」状態。型の不整合(例: Dashboard.tsx の `userData: any`, `reflections: any[]` や、App.tsx→Dashboard の Progress 型の食い違い)がビルドを素通りする。
- strict モード等の方針が定義されておらず、エディタ間で型解決の挙動すら一致しない(エイリアス `@/` の型解決も tsconfig が無いので IDE では機能しない)。

---

## 3. テストファイルの有無

### 実態
- **テストファイルはゼロ**。ファイル一覧APIの全パスに `*.test.*` / `*.spec.*` / `__tests__/` に一致するものが存在しない。
- テストランナーの設定ファイル(vitest.config, jest.config 等)も無い。

### 根拠
- git trees API(recursive, truncated:false)の全93エントリを確認。src 配下は App.tsx、components/(11画面 + ui/ 46ファイル + figma/1)、data/ 4、domain/ 1、supabase/ 2、utils/ 2、CSS 2 のみ。

### 問題
- 研究の中核である「レベル判定(スコア→level)」「推奨ルート生成」「前提条件チェック」に対する自動検証が一切なく、docs/route-generation-spec.md 等の仕様と実装の一致を機械的に確認する手段がない。仕様変更時のリグレッションを検出できない。

---

## 4. ESLint / Prettier 等の設定ファイル

### 実態
- **無し**。`.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `prettier.config.*`, `.editorconfig`, `biome.json` のいずれもファイル一覧に存在しない。package.json にも lint 系依存・scripts が無い。

### 根拠
- ファイル一覧API全エントリの目視確認。ルートの隠しファイルは `.gitignore` と `.npmrc` のみ。

### 問題
- コードスタイル・静的解析の基準がゼロ。実際に SignupSurvey.tsx ではコンポーネント内部で `determineLevel` だけインデントが崩れている(lint があれば検出される類)。未使用 import(`saveProfile` は import されるが未使用)も放置される。

---

## 5. CI (.github/workflows) の有無

### 実態
- **`.github/` ディレクトリ自体が存在しない**。GitHub Actions ワークフローはゼロ。他のCI設定(circleci, gitlab-ci 等)も無い。

### 根拠
- git trees API に `.github` で始まるパスが1件も無い。

### 問題
- push しても build すら自動実行されない。項目1〜4の欠落(test/lint/typecheck 不在)と合わせ、**「main にあるコードが少なくともビルドできる」ことすら誰も保証していない**。lock ファイル不在(項目1)と組み合わさり、他環境での再現に失敗しても気づけない。

---

## 6. vite.config.ts の特記事項

### 実態
1. プラグイン: `@vitejs/plugin-react-swc` のみ。
2. エイリアス: `'@': path.resolve(__dirname, './src')` に加え、**約40件の「`パッケージ名@バージョン` → `パッケージ名`」という自己参照エイリアス**が定義されている(例: `'vaul@1.1.2': 'vaul'`, `'@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip'`)。これは Figma Make が生成する import 指定子(`import ... from 'sonner@2.0.3'`)を通常の npm パッケージへ張り替えるための痕跡。
3. build: `target: 'esnext'`, `outDir: 'build'`(標準の dist ではない。.gitignore は `/build` と `/dist` 両方を除外)。
4. server: `port: 3000`, `open: true`。
5. minify や sourcemap、test セクションの指定は無し。

### 根拠 (vite.config.ts)
```ts
plugins: [react()],
resolve: {
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  alias: {
    'vaul@1.1.2': 'vaul',
    ...
    '@': path.resolve(__dirname, './src'),
  },
},
build: { target: 'esnext', outDir: 'build' },
```

### 問題
- バージョン付きエイリアスは vite 経由でしか解決できないため、**vitest 以外のテストランナーや tsc、IDE の型解決がソースを解釈できない**要因になる(現状 src 内の import が素の名前なら実害は薄いが、Figma Make 再エクスポートで混入し得る)。
- エイリアスに書かれたバージョンと package.json の semver 範囲が将来ずれても検知されない(二重管理)。
- `target: 'esnext'` はブラウザ互換性を狭める。研究の被験者環境(古いブラウザ)で動かないリスクの管理がされていない。
- なお `.npmrc` は `@jsr:registry=https://npm.jsr.io` の1行のみで、JSR レジストリ依存(`@jsr/supabase__supabase-js`)のためのもの。CI を組む場合もこの設定が前提になる点は記録しておく。

---

## 7. ブランチとコミット運用

### 実態
- ブランチは2本: `main` と `fable5/github-write-test`。**両方とも同一 SHA (16d2f93)** を指しており、実質 main 1本運用。
- 直近コミット(いずれも author/committer = kai02221514、未署名、親1つ=マージコミット無し):
  - 16d2f93 2026-07-02T04:01Z 「Add research documentation for MVP scope, ...」(docs 一括追加)
  - 60c81e9 2026-07-02T03:56Z 「Refine research context documents ...」
  - 1a8efb5 2026-07-02T03:34Z 「feat: Add research context documentation ...」(11ファイル一括)
  - 0f09e5b 2026-06-18T16:27Z 「Restrict learning flows to MVP nodes」
  - 0ce6278 2026-06-18T16:16Z 「Rename modules to nodes across learning flow」

### 根拠
- branches API: `[{"name":"fable5/github-write-test","commit":{"sha":"16d2f93..."}},{"name":"main","commit":{"sha":"16d2f93..."}}]`
- commits API: 全コミットの parents が1件のみ(マージ無し)、`"verified":false,"reason":"unsigned"`。

### 問題
- **main 直接コミット運用**(マージコミット・PR の痕跡なし、ブランチ保護 `"protected":false`)。CI が無いことと合わせ、壊れた状態が main に直行し得る。
- コミット粒度が粗く(ドキュメント11本を1コミット等)、同日中に同内容の書き直しコミットが連続しており、変更理由の追跡が困難。
- 2026-06-18 → 2026-07-02 の間に履歴が飛んでおり、その間の作業(あれば)はローカルにのみ存在した可能性。

---

## 8. 依存関係の重さと研究目的に対する過剰さ

### 実態
- dependencies 42パッケージ。うち **Radix UI が27パッケージ**、`src/components/ui/` に shadcn/ui テンプレート一式 **46ファイル** が同梱されている(Figma Make エクスポートの定型出力)。
- 一方、アプリ本体(App.tsx + 11画面コンポーネント)が実際に使う ui/ コンポーネントは button, card, label, select, alert, badge, avatar, progress 等の**ごく一部**。
- carousel(embla)、calendar(react-day-picker)、input-otp、drawer(vaul)、command(cmdk)、resizable(react-resizable-panels)、chart(recharts)、sidebar、menubar 等は ui/ ラッパーだけ存在し、画面から参照されている形跡がファイル構成上見当たらない。
- Tailwind 系: `tailwind-merge`/`clsx`/`cva` はあるが、tailwind.config も devDependency の tailwindcss も無い(index.css 63KB に生成済みCSSを直置きしている構成と推定される)。

### 根拠
- package.json dependencies(前掲)、git trees API の `src/components/ui/` 46エントリ。
- App.tsx の import は自作11コンポーネント + domain のみ。

### 問題
- 研究MVP(12ノードの学習フロー検証)に対して依存が明確に過剰。インストール・ビルド時間、脆弱性監査(npm audit)対象、バージョン整合(項目6の二重管理)のコストだけが増えている。
- 未使用依存が多いと「どの依存が実験結果に影響したか」の追跡が事実上不可能になり、監査観点でノイズが大きい。
- 削減自体は shadcn 構成なら ui/ ファイル削除+依存削除で機械的に可能(未使用検出ツールも無いので、まず lint/knip 等の導入が前提になる)。

---

## 9. ドメインロジックの単体テスト可能性

### 実態
- **切り出し済みで即テスト可能なもの**: `src/domain/mvpScope.ts` のみ。純粋な TS モジュール(React 非依存)で、MVP_NODE_IDS 定義、カタログ整合性検証(前提ノードがMVP外なら throw)、`isMvpNodeId` / `getMvpLearningNodes` を提供。データ(`src/data/learningNodes.ts`)も静的で、このままユニットテスト可能。
- **コンポーネント内に埋没しているロジック**:
  - レベル判定: `SignupSurvey.tsx` 内の `calculateScore()`(formData という React state に依存)と `determineLevel(score)`(実は純関数だが**コンポーネント内で定義され export されていない**)。閾値 24/17/10 がここにハードコード。
  - 前提条件チェック: `Dashboard.tsx` 内の `checkPrerequisites(nodeId)`(learningNodesArray と progress.completedNodeIds に依存。ロジック自体は純粋だが未 export)。
  - ノード状態分類(completed/current/locked/available): Dashboard.tsx の **JSX 内即時実行関数 `(() => {...})()`** の中に書かれており、テスト不可能な最深部にある。
  - 推奨ルートの起点: `App.tsx` の useState 初期値に `recommendedStartNodeIds: ['html-010']` と**ハードコード**。docs/route-generation-spec.md にあるはずの「ルート生成」アルゴリズムは独立した実装として存在せず、初期値+アンケート結果の表示に留まる。
  - さらに App.tsx の初期 Progress にモックデータ(completedNodeIds: ['html-000'], streak 3, quizScores [85,92,78] 等)が混入しており、実データとデモデータの境界が無い。

### 根拠
- mvpScope.ts 全文(純モジュール)、SignupSurvey.tsx の `calculateScore`/`determineLevel`、Dashboard.tsx の `checkPrerequisites` と JSX 内 IIFE、App.tsx の useState 初期値。

### 問題と切り出しの実現可能性評価
- **切り出しは十分可能**(障害は構造ではなく未着手であること):
  1. `determineLevel` と「回答配列→スコア」計算は formData を引数化すれば数行で `src/domain/levelAssessment.ts` に移せる(questionConfig.ts は既にデータとして分離済み)。
  2. `checkPrerequisites` とノード状態分類は `(nodes, completedIds, recommendedIds)` を引数に取る純関数として `src/domain/routing.ts` へ移せる。
  3. ルート生成本体は spec(docs/route-generation-spec.md)に対する実装が未分離/未実装のため、切り出しではなく**新規実装+テスト**が必要。
- **現状の障害**: (a) テストランナー・tsconfig・TypeScript 本体が無くテストを書いても実行基盤が無い、(b) ロジックが React state・JSX に密結合、(c) App.tsx のモック初期値が仕様上の初期状態と区別されておらず期待値が定義できない、(d) questionConfig.json と questionConfig.ts の二重管理(どちらが正か不明)で入力データの単一情報源が無い。
- 推奨最小構成(参考、変更は本監査の範囲外): `typescript` + `tsconfig.json` + `vitest` を devDependencies に追加し、scripts に `"test": "vitest run"`, `"typecheck": "tsc --noEmit"` を定義、mvpScope/levelAssessment/routing の3モジュールにユニットテスト、GitHub Actions で `npm ci && npm run typecheck && npm test && npm run build` を PR 必須化。

---

## 総括(欠落の重大度順)

| # | 欠落 | 影響 |
|---|------|------|
| 1 | テスト0件・テスト基盤なし | 研究の中核ロジック(レベル判定・ルート)の正しさを誰も検証していない |
| 2 | 型検査が実行不可能(tsconfig なし・typescript 未導入・SWC/esbuild は型検査しない) | .ts 拡張子のみで型安全性は実質ゼロ |
| 3 | CI なし(.github 自体なし)+ main 直コミット + lock ファイル除外 + ワイルドカード依存 | ビルド可能性・再現性が個人環境依存 |
| 4 | lint/format なし | 品質基準ゼロ、未使用コード検出不能 |
| 5 | 依存過剰(Radix 27 + shadcn 46ファイル、大半未使用) | 監査ノイズ・脆弱性表面積の増大 |
| 6 | ドメインロジックがコンポーネント埋没、ルート生成は仕様のみで独立実装なし | テスト導入前にリファクタ(または新規実装)が必要 |
