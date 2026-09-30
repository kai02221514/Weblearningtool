// エラーIDに対応する教材ノードと優先度を参照する。
import {
  getMvpErrorMapping,
  type MvpErrorMapping,
} from "../data/errorMappings";
import { isMvpNodeId, MVP_NODE_IDS, type MvpNodeId } from "./mvpScope";
import type {
  ErrorHistoryEntry,
  QuizResult,
  RecommendationReason,
  RecommendationReasonCode,
  ReflectionEntry,
  RouteCatalog,
  RouteGenerationWarning,
} from "./routeGeneration";

// 推薦候補の優先度。数値が小さいほど先に推薦する。
export type Priority = 1 | 2 | 3 | 4 | 5 | 6;

// 検証済みカタログは、ノードIDから前提ノードをすぐ引けるMapとして扱う。
export interface ValidCatalog {
  prerequisitesByNodeId: Map<MvpNodeId, MvpNodeId[]>;
}

// 1つの入力事実から生まれた推薦シグナル。
export interface CandidateSignal {
  priority: Priority;
  reason: RecommendationReason;
  // 同じ優先度を並べるための証拠時刻と反復回数。
  timestamp: number;
  repetition: number;
  // 理由は記録しても、それ単独で推薦候補にできるかを分けて保持する。
  eligible: boolean;
}

// 1つの教材ノードに集約された推薦候補。複数のシグナルと理由を持てる。
export interface Candidate {
  nodeId: MvpNodeId;
  signals: CandidateSignal[];
  reasons: RecommendationReason[];
}

// 検証済みエラー履歴と、対応する教材ノード定義を組にする。
interface ValidErrorState {
  entry: ErrorHistoryEntry;
  mapping: MvpErrorMapping;
}

// 不明なノードIDを除去した後の振り返りデータ。
interface ValidReflectionState {
  nodeId: MvpNodeId;
  struggledNodeIds: MvpNodeId[];
  submittedAt: string;
}

// MVP_NODE_IDS内の位置を保持し、同点時に正式な教材順で並べられるようにする。
const catalogOrder = new Map<string, number>(
  MVP_NODE_IDS.map((nodeId, index) => [nodeId, index]),
);
// 各MVPノードに対応する正規の確認テストIDを、検索しやすいSetにする。
const knownQuizIds = new Set(MVP_NODE_IDS.map((nodeId) => `quiz-${nodeId}`));

// 1ノード内に複数の理由がある場合の、理由表示の固定順。
const reasonOrder: Record<RecommendationReasonCode, number> = {
  IN_PROGRESS: 1,
  ERROR_REMEDIATION: 2,
  REVIEW: 3,
  QUIZ_FAILED: 4,
  REFLECTION_FLAG: 5,
  PREREQUISITE: 6,
  DIAGNOSIS_START: 7,
  NEXT_UNLOCKED: 8,
};

// ISO形式などの日時文字列を比較可能な数値へ変換する。不正な日時は最も古いものとして扱う。
export function timestampValue(timestamp: string): number {
  const value = Date.parse(timestamp);
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
}

// Array.sort用の比較関数。大きい数値を先へ並べる。
function compareNumbersDescending(left: number, right: number): number {
  if (left === right) return 0;
  return left > right ? -1 : 1;
}

// ノードIDの文字列順ではなく、MVPカタログに定義された学習順で比較する。
function compareCatalogOrder(left: MvpNodeId, right: MvpNodeId): number {
  return (
    (catalogOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
    (catalogOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
  );
}

// Setで重複排除した警告を文字列順へそろえ、入力配列の順序に左右されない結果にする。
export function warningList(
  warnings: ReadonlySet<RouteGenerationWarning>,
): RouteGenerationWarning[] {
  return [...warnings].sort((left, right) => left.localeCompare(right));
}

// カタログがMVPの完全な前提グラフとして使えるか検査し、使えなければnullを返す。
export function validateCatalog(catalog: RouteCatalog): ValidCatalog | null {
  // 版番号が空、またはノード数がMVPの12件と一致しなければ無効。
  if (
    catalog.catalogVersion.trim().length === 0 ||
    catalog.nodes.length !== MVP_NODE_IDS.length
  ) {
    return null;
  }

  // 各ノードを検査しながら、後続処理で使いやすい「ノードID → 前提一覧」へ変換する。
  const prerequisitesByNodeId = new Map<MvpNodeId, MvpNodeId[]>();
  for (const node of catalog.nodes) {
    // MVP外IDと、同じノードIDの重複を拒否する。
    if (!isMvpNodeId(node.nodeId) || prerequisitesByNodeId.has(node.nodeId)) {
      return null;
    }

    const prerequisites: MvpNodeId[] = [];
    // 1ノード内で同じ前提IDが重複していないかもSetで確認する。
    const prerequisiteIds = new Set<string>();
    for (const prerequisiteId of node.prerequisites) {
      if (!isMvpNodeId(prerequisiteId) || prerequisiteIds.has(prerequisiteId)) {
        return null;
      }
      prerequisiteIds.add(prerequisiteId);
      prerequisites.push(prerequisiteId);
    }
    prerequisitesByNodeId.set(node.nodeId, prerequisites);
  }

  // MVPの正規ノードが1件でも欠けていれば、完全なカタログとして扱わない。
  if (MVP_NODE_IDS.some((nodeId) => !prerequisitesByNodeId.has(nodeId))) {
    return null;
  }

  // すべての前提IDについて、参照先ノードがカタログ内に存在するか確認する。
  for (const prerequisites of prerequisitesByNodeId.values()) {
    if (prerequisites.some((nodeId) => !prerequisitesByNodeId.has(nodeId))) {
      return null;
    }
  }

  // 深さ優先探索で前提関係の循環を調べる。visiting中のノードへ戻れば循環である。
  const visitState = new Map<MvpNodeId, "visiting" | "visited">();
  const hasCycle = (nodeId: MvpNodeId): boolean => {
    const state = visitState.get(nodeId);
    if (state === "visiting") return true;
    if (state === "visited") return false;

    // このノードの探索を開始し、前提ノードを再帰的に調べる。
    visitState.set(nodeId, "visiting");
    const prerequisites = prerequisitesByNodeId.get(nodeId);
    if (!prerequisites || prerequisites.some(hasCycle)) return true;
    // すべての前提を循環なしで確認できたため探索済みにする。
    visitState.set(nodeId, "visited");
    return false;
  };

  if (MVP_NODE_IDS.some(hasCycle)) return null;

  // すべての検査を通過した場合だけ、型の確定した前提Mapを返す。
  return { prerequisitesByNodeId };
}

// 未知のIDを、共通形式の警告文字列として追加する。
export function addUnknownWarning(
  warnings: Set<RouteGenerationWarning>,
  id: string,
): void {
  warnings.add(`UNKNOWN_ID:${id}`);
}

// 文字列のID一覧からMVPノードだけをSetへ集め、不明なIDは警告へ回す。
export function normalizeNodeIds(
  nodeIds: readonly string[],
  warnings: Set<RouteGenerationWarning>,
): Set<MvpNodeId> {
  // Setに入れることで、有効なIDの重複も同時に取り除く。
  const normalized = new Set<MvpNodeId>();
  for (const nodeId of nodeIds) {
    if (isMvpNodeId(nodeId)) {
      normalized.add(nodeId);
    } else {
      addUnknownWarning(warnings, nodeId);
    }
  }
  return normalized;
}

// 同じ確認テストの複数履歴から、現在状態として採用する1件を先頭へ並べる。
function compareQuizResults(left: QuizResult, right: QuizResult): number {
  // まず受験日時が新しいものを優先する。
  const timeComparison = compareNumbersDescending(
    timestampValue(left.takenAt),
    timestampValue(right.takenAt),
  );
  if (timeComparison !== 0) return timeComparison;

  // 同日時なら受験回数、合否、得点の順で必ず1つの順序に決める。
  const attemptComparison = compareNumbersDescending(
    left.attempt,
    right.attempt,
  );
  if (attemptComparison !== 0) return attemptComparison;
  if (left.passed !== right.passed) return left.passed ? -1 : 1;
  return compareNumbersDescending(left.score, right.score);
}

// 確認テスト履歴を検証し、テストIDごとの最新状態へまとめる。
export function currentQuizResults(
  quizResults: readonly QuizResult[],
  warnings: Set<RouteGenerationWarning>,
): { current: QuizResult[]; validInputCount: number } {
  // 同じquizIdの履歴を同じ配列へ集める。
  const grouped = new Map<string, QuizResult[]>();
  let validInputCount = 0;

  for (const result of quizResults) {
    // ノードIDとテストIDをそれぞれ検証し、未知なら警告を残して無視する。
    const validNodeId = isMvpNodeId(result.nodeId);
    const validQuizId = knownQuizIds.has(result.quizId);
    if (!validNodeId) addUnknownWarning(warnings, result.nodeId);
    if (!validQuizId) addUnknownWarning(warnings, result.quizId);
    if (!validNodeId || !validQuizId) continue;
    // 正規ID同士でもquiz-html-010とhtml-020のような組み合わせ違いは無効。
    if (result.quizId !== `quiz-${result.nodeId}`) {
      addUnknownWarning(warnings, result.quizId);
      continue;
    }

    // 有効な入力件数は、後で「診断以外の進捗が存在するか」を判定するためにも使う。
    validInputCount += 1;
    const existing = grouped.get(result.quizId) ?? [];
    existing.push(result);
    grouped.set(result.quizId, existing);
  }

  // グループごとの先頭を現在状態として選び、最後にquizId順へ固定する。
  const current = [...grouped.values()]
    .map((results) => [...results].sort(compareQuizResults)[0])
    .filter((result): result is QuizResult => result !== undefined)
    .sort((left, right) => left.quizId.localeCompare(right.quizId));

  return { current, validInputCount };
}

// 同じエラーIDの履歴から、現在状態として採用する1件を先頭へ並べる。
function compareErrorEntries(
  left: ErrorHistoryEntry,
  right: ErrorHistoryEntry,
): number {
  // 最新発生時刻を優先し、同時刻なら発生回数が多いものを優先する。
  const timeComparison = compareNumbersDescending(
    timestampValue(left.lastOccurredAt),
    timestampValue(right.lastOccurredAt),
  );
  if (timeComparison !== 0) return timeComparison;

  const countComparison = compareNumbersDescending(
    left.occurrenceCount,
    right.occurrenceCount,
  );
  if (countComparison !== 0) return countComparison;
  // 時刻と回数も同じなら、未解消の記録を先にする。
  if (left.resolved !== right.resolved) return left.resolved ? 1 : -1;
  return 0;
}

// エラー履歴を検証し、エラーIDごとの最新状態と教材対応表を返す。
export function currentErrorStates(
  errorHistory: readonly ErrorHistoryEntry[],
  warnings: Set<RouteGenerationWarning>,
): { current: ValidErrorState[]; validInputCount: number } {
  const grouped = new Map<string, ValidErrorState[]>();
  let validInputCount = 0;

  for (const entry of errorHistory) {
    // 対応表にないエラーIDは推薦先を決められないため、警告を残して無視する。
    const mapping = getMvpErrorMapping(entry.errorId);
    if (!mapping) {
      addUnknownWarning(warnings, entry.errorId);
      continue;
    }

    validInputCount += 1;
    // 同じエラーIDの履歴と、検索済みの対応表を一緒にグループ化する。
    const existing = grouped.get(entry.errorId) ?? [];
    existing.push({ entry, mapping });
    grouped.set(entry.errorId, existing);
  }

  // エラーIDごとに現在状態を1件選び、出力順をerrorIdで固定する。
  const current = [...grouped.values()]
    .map(
      (states) =>
        [...states].sort((left, right) =>
          compareErrorEntries(left.entry, right.entry),
        )[0],
    )
    .filter((state): state is ValidErrorState => state !== undefined)
    .sort((left, right) =>
      left.entry.errorId.localeCompare(right.entry.errorId),
    );

  return { current, validInputCount };
}

// 複数の振り返りから現在利用する1件を決めるための比較関数。
function compareReflections(
  left: ValidReflectionState,
  right: ValidReflectionState,
): number {
  // 新しい提出を優先し、同日時ならカタログ順とつまずきID列で順序を確定する。
  const timeComparison = compareNumbersDescending(
    timestampValue(left.submittedAt),
    timestampValue(right.submittedAt),
  );
  if (timeComparison !== 0) return timeComparison;

  const nodeComparison = compareCatalogOrder(left.nodeId, right.nodeId);
  if (nodeComparison !== 0) return nodeComparison;

  return left.struggledNodeIds
    .join(",")
    .localeCompare(right.struggledNodeIds.join(","));
}

// 振り返りを検証し、現在のルート生成で利用する最新の1件を返す。
export function currentReflection(
  reflections: readonly ReflectionEntry[],
  warnings: Set<RouteGenerationWarning>,
): { current: ValidReflectionState | null; validInputCount: number } {
  const validReflections: ValidReflectionState[] = [];

  for (const reflection of reflections) {
    // 振り返り元のノードが不明なら、その記録全体を候補から除外する。
    if (!isMvpNodeId(reflection.nodeId)) {
      addUnknownWarning(warnings, reflection.nodeId);
      for (const nodeId of reflection.struggledNodeIds) {
        if (!isMvpNodeId(nodeId)) addUnknownWarning(warnings, nodeId);
      }
      continue;
    }

    // つまずきノードから未知値と重複を除き、MVPの教材順へ並べる。
    const struggledNodeIds = [
      ...normalizeNodeIds(reflection.struggledNodeIds, warnings),
    ].sort(compareCatalogOrder);
    validReflections.push({
      nodeId: reflection.nodeId,
      struggledNodeIds,
      submittedAt: reflection.submittedAt,
    });
  }

  return {
    // 比較後の先頭が最新の振り返り。1件もなければnullを返す。
    current: [...validReflections].sort(compareReflections)[0] ?? null,
    validInputCount: validReflections.length,
  };
}

// 理由を構成する全項目を文字列化し、同一理由の判定と最終的な並び替えに使う。
export function reasonKey(reason: RecommendationReason): string {
  return JSON.stringify([
    reason.reasonCode,
    reason.evidence.kind,
    reason.evidence.refId,
    reason.evidence.detail ?? "",
    reason.prerequisiteFor ?? "",
  ]);
}

// 理由コードの固定順を優先し、同じコードなら理由全体のキーで順序を確定する。
export function compareReasons(
  left: RecommendationReason,
  right: RecommendationReason,
): number {
  const codeComparison =
    reasonOrder[left.reasonCode] - reasonOrder[right.reasonCode];
  if (codeComparison !== 0) return codeComparison;
  return reasonKey(left).localeCompare(reasonKey(right));
}

// 1ノードに複数シグナルがある場合、その中で最も高い優先度を候補全体の優先度とする。
export function candidatePriority(candidate: Candidate): Priority {
  return Math.min(
    ...candidate.signals.map((signal) => signal.priority),
  ) as Priority;
}

// 同じ優先度のシグナルを、証拠の新しさ・反復回数・理由キーの順で比較する。
function compareSignals(left: CandidateSignal, right: CandidateSignal): number {
  const timestampComparison = compareNumbersDescending(
    left.timestamp,
    right.timestamp,
  );
  if (timestampComparison !== 0) return timestampComparison;

  const repetitionComparison = compareNumbersDescending(
    left.repetition,
    right.repetition,
  );
  if (repetitionComparison !== 0) return repetitionComparison;
  return reasonKey(left.reason).localeCompare(reasonKey(right.reason));
}

// 候補の最高優先度に属するシグナルから、同点比較に使う最良の1件を選ぶ。
function bestTieSignal(candidate: Candidate): CandidateSignal | null {
  const priority = candidatePriority(candidate);
  return (
    [...candidate.signals]
      .filter((signal) => signal.priority === priority)
      .sort(compareSignals)[0] ?? null
  );
}

// 2つの候補を、P1〜P6、証拠時刻、反復回数、MVPカタログ順の順に比較する。
export function compareCandidates(left: Candidate, right: Candidate): number {
  // まず小さい優先度番号を先にする。
  const priorityComparison = candidatePriority(left) - candidatePriority(right);
  if (priorityComparison !== 0) return priorityComparison;

  // 同じ優先度なら、それぞれの最良シグナルで新しさと回数を比較する。
  const leftSignal = bestTieSignal(left);
  const rightSignal = bestTieSignal(right);
  if (leftSignal && rightSignal) {
    const timestampComparison = compareNumbersDescending(
      leftSignal.timestamp,
      rightSignal.timestamp,
    );
    if (timestampComparison !== 0) return timestampComparison;

    const repetitionComparison = compareNumbersDescending(
      leftSignal.repetition,
      rightSignal.repetition,
    );
    if (repetitionComparison !== 0) return repetitionComparison;
  }

  // それでも同じなら、正式なMVP教材順を最後の比較基準にする。
  return compareCatalogOrder(left.nodeId, right.nodeId);
}

// エラー履歴を、画面表示や追跡に使える構造化された推薦理由へ変換する。
export function errorReason(
  error: ErrorHistoryEntry,
  priority: number,
): RecommendationReason {
  return {
    reasonCode: "ERROR_REMEDIATION",
    evidence: {
      kind: "error",
      refId: error.errorId,
      detail: JSON.stringify({
        priority,
        occurrenceCount: error.occurrenceCount,
        lastOccurredAt: error.lastOccurredAt,
      }),
    },
  };
}

// 確認テストの不合格結果を、構造化された推薦理由へ変換する。
export function quizReason(result: QuizResult): RecommendationReason {
  return {
    reasonCode: "QUIZ_FAILED",
    evidence: {
      kind: "quiz",
      refId: result.quizId,
      detail: JSON.stringify({
        score: result.score,
        attempt: result.attempt,
        takenAt: result.takenAt,
      }),
    },
  };
}
