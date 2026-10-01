// 学習ノード定義からカタログの版番号を取得する。
import learningNodesData from "../data/learningNodes";
// MVP対象のノード一覧と、そのIDだけを許可する型を利用する。
import { getMvpLearningNodes, type MvpNodeId } from "./mvpScope";

// このファイルが従うルート生成仕様の版。as constで一般的なstringではなく、この文字列に型を固定する。
export const ROUTE_SPEC_VERSION = "route-spec/1.0" as const;

// 診断で受け付ける回答値を、質問ごとの文字列の候補として定義する。
export type ProgrammingExperience = "yes" | "no";
export type RuleConfidence = "none" | "low" | "partial" | "confident";
export type KnowledgeConcept =
  | "visual_only"
  | "unknown"
  | "somewhat"
  | "structure_style";

// 診断画面などから渡される回答。未回答や外部入力も検査できるよう、string・null・undefinedを許容する。
export interface DiagnosisAnswers {
  programming_experience?: string | null;
  rule_confidence?: string | null;
  knowledge_concept?: string | null;
}

// ルート開始位置の判定に使った質問を記録するときのID。
export type DiagnosisQuestionId =
  | "programming_experience"
  | "rule_confidence"
  | "knowledge_concept";

// 診断仕様に定義された4つの開始ノード判定ルールを識別するID。
export type StartNodeRuleId =
  | "DG-RULE-1"
  | "DG-RULE-2"
  | "DG-RULE-3"
  | "DG-RULE-4";

// 診断が存在しない場合と、一部だけ回答されている場合を区別する警告。
export type DiagnosisWarning = "DIAGNOSIS_INCOMPLETE" | "DIAGNOSIS_MISSING";

// 診断判定の結果。開始位置だけでなく、判断根拠と警告も後から確認できる形で返す。
export interface StartNodeDecision {
  // MVPで開始位置として選べるのは、HTMLの最初または2番目のノードだけ。
  startNodeId: "html-000" | "html-010";
  // 診断により理解済みと仮定するノード。実際の完了履歴とは分けて扱う。
  assumedNodeIds: MvpNodeId[];
  // どの判定ルールが適用されたかを記録する。
  matchedRuleId: StartNodeRuleId;
  // 判定に利用できた回答だけを質問IDと値の組で保存する。
  usedAnswers: {
    questionId: DiagnosisQuestionId;
    value: string;
  }[];
  warnings: DiagnosisWarning[];
}

// ルート生成が参照する教材カタログの最小構造。
export interface RouteCatalog {
  catalogVersion: string;
  nodes: {
    nodeId: string;
    prerequisites: string[];
  }[];
}

// 画面に提示できる推薦件数を、MVPの全12ノードの範囲に制限する。
export type MaxRecommendations =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

// 1回分の確認テスト結果。いつ、何回目に、どのノードで受験したかを保持する。
export interface QuizResult {
  quizId: string;
  nodeId: string;
  passed: boolean;
  score: number;
  attempt: number;
  takenAt: string;
}

// 実践課題などで検出したエラーの履歴。発生回数・最新時刻・解消状態を持つ。
export interface ErrorHistoryEntry {
  errorId: string;
  occurrenceCount: number;
  lastOccurredAt: string;
  resolved: boolean;
}

// 学習後の振り返り。どのノードで、どの学習項目につまずいたかを保持する。
export interface ReflectionEntry {
  nodeId: string;
  struggledNodeIds: string[];
  submittedAt: string;
}

// routeGeneratorへまとめて渡す入力スナップショット。
export interface RouteGenerationInput {
  catalog: RouteCatalog;
  // 診断未実施または欠損時はnullを受け取る。
  diagnosis: StartNodeDecision | null;
  progress: {
    // 完了・診断による習得仮定・現在学習中を別々に管理する。
    completedNodeIds: string[];
    assumedNodeIds: string[];
    inProgressNodeId: string | null;
  };
  quizResults: QuizResult[];
  errorHistory: ErrorHistoryEntry[];
  reflections: ReflectionEntry[];
  maxRecommendations: MaxRecommendations;
}

// あるノードをルートへ入れた理由。画面表示用の文章ではなく、処理で扱える固定コードを返す。
export type RecommendationReasonCode =
  | "IN_PROGRESS"
  | "ERROR_REMEDIATION"
  | "QUIZ_FAILED"
  | "REFLECTION_FLAG"
  | "NEXT_UNLOCKED"
  | "DIAGNOSIS_START"
  | "PREREQUISITE"
  | "REVIEW";

// 推薦理由が、診断・進捗・テストなど、どの入力を根拠にしたかを表す。
export type RecommendationEvidenceKind =
  | "diagnosis"
  | "progress"
  | "quiz"
  | "error"
  | "reflection"
  | "catalog";

// 推薦理由と、その判断を追跡するための根拠情報。
export interface RecommendationReason {
  reasonCode: RecommendationReasonCode;
  evidence: {
    kind: RecommendationEvidenceKind;
    refId: string;
    detail?: string;
  };
  // 前提学習として挿入した場合は、どのノードのために必要だったかも記録する。
  prerequisiteFor?: MvpNodeId;
}

// ルート生成の終了状態。正常時も、学習中・完了・入力不足を分けて返す。
export type RouteGenerationStatus =
  | "active"
  | "completed"
  | "insufficient-input"
  | "error";

// 生成は続けられるが確認が必要な問題と、生成不能なカタログエラーなどを表す。
export type RouteGenerationWarning =
  | DiagnosisWarning
  | `UNKNOWN_ID:${string}`
  | "CATALOG_INVALID"
  | "NON_MVP_OUTPUT";

// routeGeneratorが返す結果。再現性を確認できるよう、仕様・カタログ・参照データの版も含める。
export interface RouteGenerationResult {
  specVersion: typeof ROUTE_SPEC_VERSION;
  catalogVersion: string;
  dataVersion: string;
  status: RouteGenerationStatus;
  nextNodeId: MvpNodeId | null;
  // 推薦する全ノードを順番・理由とともに保持する。
  route: {
    nodeId: MvpNodeId;
    order: number;
    reasons: RecommendationReason[];
  }[];
  // route全体を切り捨てず、そのうち画面に提示する件数だけを別に返す。
  presentedCount: number;
  warnings: RouteGenerationWarning[];
}

// unknownな値が、プログラミング経験の有効な回答かを実行時に判定する型ガード。
function isProgrammingExperience(
  value: unknown,
): value is ProgrammingExperience {
  return value === "yes" || value === "no";
}

// ルール記述への自信について、定義済みの4択だけを有効とする。
function isRuleConfidence(value: unknown): value is RuleConfidence {
  return (
    value === "none" ||
    value === "low" ||
    value === "partial" ||
    value === "confident"
  );
}

// HTMLとCSSの役割に関する理解について、定義済みの4択だけを有効とする。
function isKnowledgeConcept(value: unknown): value is KnowledgeConcept {
  return (
    value === "visual_only" ||
    value === "unknown" ||
    value === "somewhat" ||
    value === "structure_style"
  );
}

// 回答のうち有効な値だけを集め、判定で参照した情報として返せる形へ変換する。
function collectValidAnswers(
  diagnosis: DiagnosisAnswers,
): StartNodeDecision["usedAnswers"] {
  const usedAnswers: StartNodeDecision["usedAnswers"] = [];

  // 各回答は型ガードを通過した場合だけ追加するため、未回答や未知の値は記録しない。
  if (isProgrammingExperience(diagnosis.programming_experience)) {
    usedAnswers.push({
      questionId: "programming_experience",
      value: diagnosis.programming_experience,
    });
  }
  if (isRuleConfidence(diagnosis.rule_confidence)) {
    usedAnswers.push({
      questionId: "rule_confidence",
      value: diagnosis.rule_confidence,
    });
  }
  if (isKnowledgeConcept(diagnosis.knowledge_concept)) {
    usedAnswers.push({
      questionId: "knowledge_concept",
      value: diagnosis.knowledge_concept,
    });
  }

  return usedAnswers;
}

// 診断回答を決定表へ当てはめ、html-000またはhtml-010のどちらから始めるか決める。
export function decideStartNode(
  diagnosis: DiagnosisAnswers | null,
): StartNodeDecision {
  // DG-RULE-4: 診断そのものがない場合は、安全側としてhtml-000から開始して警告を返す。
  if (diagnosis === null) {
    return {
      startNodeId: "html-000",
      assumedNodeIds: [],
      matchedRuleId: "DG-RULE-4",
      usedAnswers: [],
      warnings: ["DIAGNOSIS_MISSING"],
    };
  }

  // DG-RULE-1: 未経験という回答だけで初学者と判断できるため、残りの回答は要求しない。
  if (diagnosis.programming_experience === "no") {
    return {
      startNodeId: "html-000",
      assumedNodeIds: [],
      matchedRuleId: "DG-RULE-1",
      usedAnswers: [
        {
          questionId: "programming_experience",
          value: diagnosis.programming_experience,
        },
      ],
      warnings: [],
    };
  }

  // 以降の判定を読みやすくするため、3つの回答をローカル変数へ取り出す。
  const programmingExperience = diagnosis.programming_experience;
  const ruleConfidence = diagnosis.rule_confidence;
  const knowledgeConcept = diagnosis.knowledge_concept;

  // 3項目がすべて有効な選択肢であれば、知識状態に応じてDG-RULE-2か3を適用する。
  if (
    isProgrammingExperience(programmingExperience) &&
    isRuleConfidence(ruleConfidence) &&
    isKnowledgeConcept(knowledgeConcept)
  ) {
    const usedAnswers = collectValidAnswers(diagnosis);
    // DG-RULE-2: 経験があっても、自信が低いか概念理解が弱い場合は基礎から開始する。
    if (
      ruleConfidence === "none" ||
      ruleConfidence === "low" ||
      knowledgeConcept === "visual_only" ||
      knowledgeConcept === "unknown"
    ) {
      return {
        startNodeId: "html-000",
        assumedNodeIds: [],
        matchedRuleId: "DG-RULE-2",
        usedAnswers,
        warnings: [],
      };
    }

    // DG-RULE-3: 経験があり、ルールと概念も一定以上理解していればhtml-010から開始する。
    // 飛ばすhtml-000は完了済みではなく、診断による習得仮定として記録する。
    return {
      startNodeId: "html-010",
      assumedNodeIds: ["html-000"],
      matchedRuleId: "DG-RULE-3",
      usedAnswers,
      warnings: [],
    };
  }

  // DG-RULE-4: 回答が不足または不正な場合もhtml-000へ戻し、有効だった回答だけを記録する。
  return {
    startNodeId: "html-000",
    assumedNodeIds: [],
    matchedRuleId: "DG-RULE-4",
    usedAnswers: collectValidAnswers(diagnosis),
    warnings: ["DIAGNOSIS_INCOMPLETE"],
  };
}

// 正式なMVPノード定義から、ルート生成に必要なIDと前提関係だけを取り出す。
export function getMvpRouteCatalog(): RouteCatalog {
  return {
    // ノードデータ側の版をそのままカタログの版として記録する。
    catalogVersion: learningNodesData.version,
    // mapで各ノードを簡略化し、前提配列はコピーして元データが変更されないようにする。
    nodes: getMvpLearningNodes().map((node) => ({
      nodeId: node.id,
      prerequisites: [...node.prerequisites],
    })),
  };
}
