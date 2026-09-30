// エラーIDから復習候補ノードへ結び付ける参照データを読み込む。
import errorMappingsData from "../data/errorMappings";
import { isMvpNodeId, MVP_NODE_IDS, type MvpNodeId } from "./mvpScope";
import {
  ROUTE_SPEC_VERSION,
  type RecommendationReason,
  type RouteGenerationInput,
  type RouteGenerationResult,
  type RouteGenerationWarning,
} from "./routeGeneration";
import {
  addUnknownWarning,
  candidatePriority,
  compareCandidates,
  compareReasons,
  currentErrorStates,
  currentQuizResults,
  currentReflection,
  errorReason,
  normalizeNodeIds,
  quizReason,
  reasonKey,
  timestampValue,
  validateCatalog,
  warningList,
  type Candidate,
  type CandidateSignal,
  type Priority,
} from "./routeGeneratorSupport";

// 今回の生成結果が使ったエラー対応データの版を、そのまま出力へ記録する。
export const ROUTE_DATA_VERSION = errorMappingsData.version;

// 処理途中で続行できない問題が起きたとき、部分的なルートを残さず統一形式のエラーを返す。
function createErrorResult(
  input: RouteGenerationInput,
  warnings: ReadonlySet<RouteGenerationWarning>,
): RouteGenerationResult {
  return {
    specVersion: ROUTE_SPEC_VERSION,
    catalogVersion: input.catalog.catalogVersion,
    dataVersion: ROUTE_DATA_VERSION,
    status: "error",
    nextNodeId: null,
    route: [],
    presentedCount: 0,
    warnings: warningList(warnings),
  };
}

// 診断・進捗・確認テスト・エラー・振り返りを統合し、順序付きの全学習ルートを生成する。
export function routeGenerator(
  input: RouteGenerationInput,
): RouteGenerationResult {
  // Setを使うことで、同じ警告が複数回見つかっても出力は1件にまとめる。
  const warnings = new Set<RouteGenerationWarning>();
  // 最初にカタログのノード数・ID・前提参照・循環を検査する。
  const catalog = validateCatalog(input.catalog);
  if (!catalog) {
    // カタログ全体を信用できない場合は、安全な部分ルートも返さず生成を中止する。
    warnings.add("CATALOG_INVALID");
    return createErrorResult(input, warnings);
  }

  // 診断がなければ警告を追加し、存在する場合は診断判定時の警告を引き継ぐ。
  if (input.diagnosis === null) {
    warnings.add("DIAGNOSIS_MISSING");
  } else {
    for (const warning of input.diagnosis.warnings) warnings.add(warning);
  }

  // 進捗内のIDをMVPノードだけに正規化し、未知のIDは警告へ回す。
  const completedNodeIds = normalizeNodeIds(
    input.progress.completedNodeIds,
    warnings,
  );
  const progressAssumedNodeIds = normalizeNodeIds(
    input.progress.assumedNodeIds,
    warnings,
  );
  const diagnosisAssumedNodeIds = normalizeNodeIds(
    input.diagnosis?.assumedNodeIds ?? [],
    warnings,
  );
  // 入力された進捗と今回の診断にある習得仮定を、重複のない1つの集合へ統合する。
  const assumedNodeIds = new Set<MvpNodeId>([
    ...progressAssumedNodeIds,
    ...diagnosisAssumedNodeIds,
  ]);

  // 学習中ノードもMVP内のIDだけを採用し、未知なら推薦には使わない。
  let inProgressNodeId: MvpNodeId | null = null;
  if (input.progress.inProgressNodeId !== null) {
    if (isMvpNodeId(input.progress.inProgressNodeId)) {
      inProgressNodeId = input.progress.inProgressNodeId;
    } else {
      addUnknownWarning(warnings, input.progress.inProgressNodeId);
    }
  }

  // 履歴ごとに最新の有効状態だけを選び、現在も有効な不合格・未解消エラーを取り出す。
  const quizzes = currentQuizResults(input.quizResults, warnings);
  const activeQuizFailures = quizzes.current.filter((result) => !result.passed);
  const errors = currentErrorStates(input.errorHistory, warnings);
  const activeErrors = errors.current.filter((state) => !state.entry.resolved);
  // 振り返りは有効な記録のうち最新の1件を利用する。
  const reflection = currentReflection(input.reflections, warnings);

  // 不合格になったノードを集め、習得仮定を取り消す対象として後で利用する。
  const failedNodeIds = new Set<MvpNodeId>(
    activeQuizFailures.map((result) => result.nodeId).filter(isMvpNodeId),
  );
  // 未解消エラーが直接指している主推薦ノードも、習得仮定を取り消す対象にする。
  const primaryErrorNodeIds = new Set<MvpNodeId>();
  for (const { mapping } of activeErrors) {
    for (const nodeRef of mapping.nodeRefs) {
      if (nodeRef.priority === 1) primaryErrorNodeIds.add(nodeRef.nodeId);
    }
  }

  // 元の習得仮定をコピーし、テストやエラーで反証されたノードだけを取り除く。
  const effectiveAssumedNodeIds = new Set<MvpNodeId>(assumedNodeIds);
  primaryErrorNodeIds.forEach((nodeId) =>
    effectiveAssumedNodeIds.delete(nodeId),
  );
  failedNodeIds.forEach((nodeId) => effectiveAssumedNodeIds.delete(nodeId));

  // 完了済みまたは習得仮定のノードは、新規学習候補から除外するための基準にする。
  const baseSatisfiedNodeIds = new Set<MvpNodeId>(completedNodeIds);
  assumedNodeIds.forEach((nodeId) => baseSatisfiedNodeIds.add(nodeId));
  // 前提充足の判定では、反証された習得仮定を除外する。
  // これにより、必要ならそのノードが前提学習としてルートへ戻る。
  const prerequisiteSatisfiedNodeIds = new Set<MvpNodeId>(completedNodeIds);
  effectiveAssumedNodeIds.forEach((nodeId) =>
    prerequisiteSatisfiedNodeIds.add(nodeId),
  );

  // 同じノードが複数の理由で推薦されるため、ノードIDごとに推薦シグナルをまとめる。
  const signalsByNodeId = new Map<MvpNodeId, CandidateSignal[]>();
  // シグナルには優先度・理由・日時・回数・候補として有効かを保持する。
  const addSignal = (nodeId: MvpNodeId, signal: CandidateSignal): void => {
    const signals = signalsByNodeId.get(nodeId) ?? [];
    signals.push(signal);
    signalsByNodeId.set(nodeId, signals);
  };

  // P1: 現在取り組んでいる未完了ノードを最優先にする。
  if (inProgressNodeId && !completedNodeIds.has(inProgressNodeId)) {
    addSignal(inProgressNodeId, {
      priority: 1,
      reason: {
        reasonCode: "IN_PROGRESS",
        evidence: { kind: "progress", refId: inProgressNodeId },
      },
      timestamp: Number.NEGATIVE_INFINITY,
      repetition: 0,
      eligible: true,
    });
  }

  // P2/P4: 未解消エラーの対応表から、主推薦と補助推薦のノードを追加する。
  for (const { entry, mapping } of activeErrors) {
    for (const nodeRef of mapping.nodeRefs) {
      if (nodeRef.priority !== 1 && nodeRef.priority !== 2) continue;
      // エラー対応表のpriority 1をP2、priority 2をP4へ変換する。
      const priority = nodeRef.priority === 1 ? 2 : 4;
      addSignal(nodeRef.nodeId, {
        priority,
        reason: errorReason(entry, nodeRef.priority),
        timestamp: timestampValue(entry.lastOccurredAt),
        repetition: entry.occurrenceCount,
        // 現実装では、主推薦は完了済みでも候補にし、補助推薦単独では完了・習得仮定を除外する。
        eligible:
          nodeRef.priority === 1 || !baseSatisfiedNodeIds.has(nodeRef.nodeId),
      });
    }
  }

  // P3: 最新結果が不合格の確認テストについて、対応ノードを候補にする。
  for (const result of activeQuizFailures) {
    if (!isMvpNodeId(result.nodeId)) continue;
    addSignal(result.nodeId, {
      priority: 3,
      reason: quizReason(result),
      timestamp: timestampValue(result.takenAt),
      repetition: result.attempt,
      eligible: true,
    });
  }

  // P5: 最新の振り返りで「つまずいた」と選ばれた未学習ノードを候補にする。
  if (reflection.current) {
    for (const nodeId of reflection.current.struggledNodeIds) {
      addSignal(nodeId, {
        priority: 5,
        reason: {
          reasonCode: "REFLECTION_FLAG",
          evidence: {
            kind: "reflection",
            refId: nodeId,
            detail: JSON.stringify({
              submittedAt: reflection.current.submittedAt,
            }),
          },
        },
        timestamp: timestampValue(reflection.current.submittedAt),
        repetition: 0,
        eligible: !baseSatisfiedNodeIds.has(nodeId),
      });
    }
  }

  // 診断がない場合はDG-RULE-4相当としてhtml-000を開始位置にする。
  const diagnosisStartNodeId = input.diagnosis?.startNodeId ?? "html-000";
  const diagnosisRuleId = input.diagnosis?.matchedRuleId ?? "DG-RULE-4";
  // P6: ここまで理由が付かず、完了・習得仮定でもないノードを新規学習候補にする。
  for (const nodeId of MVP_NODE_IDS) {
    if (baseSatisfiedNodeIds.has(nodeId) || signalsByNodeId.has(nodeId))
      continue;
    addSignal(nodeId, {
      priority: 6,
      // 診断が示した開始ノードだけDIAGNOSIS_START、それ以外はNEXT_UNLOCKEDとする。
      reason:
        nodeId === diagnosisStartNodeId
          ? {
              reasonCode: "DIAGNOSIS_START",
              evidence: { kind: "diagnosis", refId: diagnosisRuleId },
            }
          : {
              reasonCode: "NEXT_UNLOCKED",
              evidence: { kind: "catalog", refId: nodeId },
            },
      timestamp: Number.NEGATIVE_INFINITY,
      repetition: 0,
      eligible: true,
    });
  }

  // ノード単位の最終候補を作り、複数のシグナルを1ノードへ集約する。
  const candidates = new Map<MvpNodeId, Candidate>();
  for (const [nodeId, signals] of signalsByNodeId) {
    // そのノードに有効なシグナルが一つもなければ、候補には採用しない。
    if (!signals.some((signal) => signal.eligible)) continue;

    // 有効候補になったノードでは、説明可能性のため関連する理由をすべて保持する。
    const reasons = signals.map((signal) => signal.reason);
    // 現実装では、完了済み・習得仮定に主エラーまたはテスト不合格がある場合に復習理由を付ける。
    const hasReviewCause =
      primaryErrorNodeIds.has(nodeId) || failedNodeIds.has(nodeId);
    if (baseSatisfiedNodeIds.has(nodeId) && hasReviewCause) {
      reasons.push({
        reasonCode: "REVIEW",
        evidence: {
          kind: "progress",
          refId: nodeId,
          detail: JSON.stringify({
            state: completedNodeIds.has(nodeId) ? "completed" : "assumed",
          }),
        },
      });
    }

    // reasonKeyで同じ理由を重複排除し、常に同じ規則で理由を並べる。
    candidates.set(nodeId, {
      nodeId,
      signals: [...signals],
      reasons: [
        ...new Map(
          reasons.map((reason) => [reasonKey(reason), reason]),
        ).values(),
      ].sort(compareReasons),
    });
  }

  // P1〜P5の候補だけを先に控え、これらに必要な未完了の前提ノードを補う。
  const originalPriorityCandidates = [...candidates.values()]
    .filter((candidate) => candidatePriority(candidate) < 6)
    .sort(compareCandidates);

  // 対象ノードまでの未充足前提を再帰的にたどり、すべて候補へ追加する。
  const addPrerequisites = (
    nodeId: MvpNodeId,
    originalNodeId: MvpNodeId,
    inheritedPriority: Priority,
  ): void => {
    const prerequisites = catalog.prerequisitesByNodeId.get(nodeId) ?? [];
    for (const prerequisiteId of prerequisites) {
      // 完了済みまたは有効な習得仮定なら、ルートへの追加は不要。
      if (prerequisiteSatisfiedNodeIds.has(prerequisiteId)) continue;

      // どの元候補のために挿入した前提かをprerequisiteForで記録する。
      const prerequisiteReason: RecommendationReason = {
        reasonCode: "PREREQUISITE",
        evidence: { kind: "catalog", refId: prerequisiteId },
        prerequisiteFor: originalNodeId,
      };
      // すでに別理由で候補になっていればその候補を再利用し、なければ新しく作る。
      let prerequisiteCandidate = candidates.get(prerequisiteId);
      if (!prerequisiteCandidate) {
        prerequisiteCandidate = {
          nodeId: prerequisiteId,
          signals: [],
          reasons: [],
        };
        candidates.set(prerequisiteId, prerequisiteCandidate);
      }
      // 同じ前提理由を二重登録せず、元候補の優先度を前提ノードにも引き継ぐ。
      if (
        !prerequisiteCandidate.reasons.some(
          (reason) => reasonKey(reason) === reasonKey(prerequisiteReason),
        )
      ) {
        prerequisiteCandidate.reasons.push(prerequisiteReason);
        prerequisiteCandidate.reasons.sort(compareReasons);
        prerequisiteCandidate.signals.push({
          priority: inheritedPriority,
          reason: prerequisiteReason,
          timestamp: Number.NEGATIVE_INFINITY,
          repetition: 0,
          eligible: true,
        });
      }

      // 追加した前提ノード自身にも前提があれば、さらに上流へさかのぼる。
      addPrerequisites(prerequisiteId, originalNodeId, inheritedPriority);
    }
  };

  // 優先理由を持つ各候補について、必要な前提ノードをルート候補へ追加する。
  for (const candidate of originalPriorityCandidates) {
    addPrerequisites(
      candidate.nodeId,
      candidate.nodeId,
      candidatePriority(candidate),
    );
  }

  // 前提関係を守りながら候補を一つずつ取り出す、トポロジカルソートを行う。
  const remainingNodeIds = new Set(candidates.keys());
  const emittedNodeIds = new Set<MvpNodeId>();
  const orderedCandidates: Candidate[] = [];
  while (remainingNodeIds.size > 0) {
    // 前提が完了済み、習得仮定、またはすでに出力済みの候補だけを「準備完了」とする。
    const readyCandidates = [...remainingNodeIds]
      .filter((nodeId) => {
        const prerequisites = catalog.prerequisitesByNodeId.get(nodeId) ?? [];
        return prerequisites.every(
          (prerequisiteId) =>
            prerequisiteSatisfiedNodeIds.has(prerequisiteId) ||
            emittedNodeIds.has(prerequisiteId),
        );
      })
      .map((nodeId) => candidates.get(nodeId))
      .filter((candidate): candidate is Candidate => candidate !== undefined)
      // 準備完了候補の中では、P1〜P6・証拠の新しさ・回数・カタログ順で並べる。
      .sort(compareCandidates);

    // 最も優先度の高い準備完了候補を、次のルート項目として選ぶ。
    const nextCandidate = readyCandidates[0];
    if (!nextCandidate) {
      // 残りがあるのに選べない場合は前提関係に問題があるため、部分結果を破棄する。
      warnings.add("CATALOG_INVALID");
      return createErrorResult(input, warnings);
    }

    orderedCandidates.push(nextCandidate);
    // 出力済み集合へ移し、後続ノードの前提が満たされた状態にする。
    emittedNodeIds.add(nextCandidate.nodeId);
    remainingNodeIds.delete(nextCandidate.nodeId);
  }

  // 内部処理の防御として、MVP外のノードが出力へ混入していないか最終確認する。
  if (orderedCandidates.some((candidate) => !isMvpNodeId(candidate.nodeId))) {
    warnings.add("NON_MVP_OUTPUT");
    return createErrorResult(input, warnings);
  }

  // 内部候補を公開用の形式へ変換し、順番は1始まりの連番にする。
  const route = orderedCandidates.map((candidate, index) => ({
    nodeId: candidate.nodeId,
    order: index + 1,
    reasons: candidate.reasons,
  }));
  // 診断がなくても、何らかの有効な学習状態があれば通常のactiveとして扱う。
  const hasProgress =
    completedNodeIds.size > 0 ||
    assumedNodeIds.size > 0 ||
    inProgressNodeId !== null ||
    quizzes.validInputCount > 0 ||
    errors.validInputCount > 0 ||
    reflection.validInputCount > 0;
  // 12ノードすべてが実際の完了集合に入っているかを確認する。
  const allNodesCompleted = MVP_NODE_IDS.every((nodeId) =>
    completedNodeIds.has(nodeId),
  );
  // 空ルートかつ全完了ならcompleted、診断も進捗もなければinsufficient-input、それ以外はactive。
  const status =
    route.length === 0 && allNodesCompleted
      ? "completed"
      : input.diagnosis === null && !hasProgress
        ? "insufficient-input"
        : "active";

  // 全ルートを保持したまま、画面へ提示する件数だけを上限値で制限して返す。
  return {
    specVersion: ROUTE_SPEC_VERSION,
    catalogVersion: input.catalog.catalogVersion,
    dataVersion: ROUTE_DATA_VERSION,
    status,
    // 完了時は次ノードなし。それ以外はルート先頭を次の学習候補とする。
    nextNodeId: status === "completed" ? null : (route[0]?.nodeId ?? null),
    route,
    presentedCount: Math.min(input.maxRecommendations, route.length),
    // Setに集めた警告を、入力順に依存しない決定的な順序へ整えて返す。
    warnings: warningList(warnings),
  };
}
