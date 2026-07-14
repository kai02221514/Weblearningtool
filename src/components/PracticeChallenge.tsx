import { useState, useEffect, useCallback } from 'react'
import { Play, CheckCircle, AlertTriangle, Home, ArrowRight, RefreshCw, Lightbulb, User, Square, XCircle, BookOpen, Code } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { getMvpErrorMapping } from '../data/errorMappings'
import {
  getMvpLearningNodes,
  isMvpNodeId,
} from '../domain/mvpScope'
import { getPilotPracticeChallenge } from '../features/practice/pilotPracticeChallenges'
import { evaluatePracticeCode } from '../features/practice/evaluatePractice'
import type {
  PracticeChallengeDefinition,
  PracticeEvaluationResult,
} from '../features/practice/types'

const learningNodesArray = getMvpLearningNodes()

interface PracticeChallengeProps {
  nodeId: string
  onComplete: () => void
  onDashboard: () => void
  onStartLearning?: (nodeId: string) => void
  initialCode?: string
}

interface ErrorItem {
  line?: number
  message: string
  relatedNodeIds?: string[]  // 関連する学習ノードのIDリスト
}

type SkillError = ErrorItem
type RuleError = ErrorItem & { example?: string }
type KnowledgeError = ErrorItem

export function PracticeChallenge({
  nodeId,
  onComplete,
  onDashboard,
  onStartLearning,
  initialCode,
}: PracticeChallengeProps) {
  const challenge = getPilotPracticeChallenge(nodeId)

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>このノードの実践課題は未対応です</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <code>{nodeId}</code> には固有の実践課題が定義されていません。汎用課題へのフォールバックは行いません。
              </p>
              <Button onClick={onDashboard} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                ダッシュボードへ戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <SupportedPracticeChallenge
      challenge={challenge}
      initialCode={initialCode}
      onComplete={onComplete}
      onDashboard={onDashboard}
      onStartLearning={onStartLearning}
    />
  )
}

interface SupportedPracticeChallengeProps {
  challenge: PracticeChallengeDefinition
  onComplete: () => void
  onDashboard: () => void
  onStartLearning?: (nodeId: string) => void
  initialCode?: string
}

function SupportedPracticeChallenge({
  challenge,
  onComplete,
  onDashboard,
  onStartLearning,
  initialCode,
}: SupportedPracticeChallengeProps) {
  const startingCode = initialCode ?? challenge.initialCode
  const [code, setCode] = useState(startingCode)
  const [feedback, setFeedback] = useState<{type: 'success' | 'warning' | 'error', message: string} | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [evaluation, setEvaluation] = useState<PracticeEvaluationResult | null>(null)
  const [srkTab, setSrkTab] = useState('overview')
  const [visibleHints, setVisibleHints] = useState(2)
  const [understanding, setUnderstanding] = useState('')
  const [difficultyNote, setDifficultyNote] = useState('')
  const [checklist, setChecklist] = useState(() => challenge.requirements.map(() => false))
  const [selectedNodeForPreview, setSelectedNodeForPreview] = useState<string | null>(null)
  
  const currentChallengeNodeId = challenge.nodeId
  const currentNode = learningNodesArray.find(n => n.id === currentChallengeNodeId)
  
  // SRKエラーのstate
  const [skillErrors, setSkillErrors] = useState<SkillError[]>([])
  const [ruleErrors, setRuleErrors] = useState<RuleError[]>([])
  const [knowledgeErrors, setKnowledgeErrors] = useState<KnowledgeError[]>([])

  // コード解析関数
  const analyzeCode = useCallback((currentCode: string) => {
    const lines = currentCode.split('\n')
    const skills: SkillError[] = []
    const rules: RuleError[] = []
    const knowledge: KnowledgeError[] = []

    // Skill エラー検出
    lines.forEach((line, index) => {
      // 閉じタグの欠落チェック
      const openTags = line.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || []
      const closeTags = line.match(/<\/([a-z][a-z0-9]*)>/gi) || []
      
      openTags.forEach(tag => {
        const tagName = tag.match(/<([a-z][a-z0-9]*)/i)?.[1]
        if (tagName && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName.toLowerCase())) {
          const closeTag = `</${tagName}>`
          if (!currentCode.includes(closeTag)) {
            // E_HTML_MISSING_CLOSING_TAG に対応
            const errorMapping = getMvpErrorMapping('E_HTML_MISSING_CLOSING_TAG')
            const relatedNodeIds = errorMapping?.nodeRefs?.map(ref => ref.nodeId) || []
            skills.push({
              line: index + 1,
              message: `\`<${tagName}>\` タグが閉じられていません。`,
              relatedNodeIds
            })
          }
        }
      })

      // セミコロン忘れチェック（CSS内）
      if (line.includes(':') && !line.includes(';') && !line.includes('{') && !line.includes('}')) {
        const inStyle = currentCode.substring(0, currentCode.indexOf(line)).includes('<style>')
        if (inStyle) {
          // E_CSS_SYNTAX_MISSING_SEMICOLON に対応
          const errorMapping = getMvpErrorMapping('E_CSS_SYNTAX_MISSING_SEMICOLON')
          const relatedNodeIds = errorMapping?.nodeRefs?.map(ref => ref.nodeId) || []
          skills.push({
            line: index + 1,
            message: 'CSSの `;` が抜けています。',
            relatedNodeIds
          })
        }
      }

      // 引用符の対応チェック
      const quotes = line.match(/["']/g) || []
      if (quotes.length % 2 !== 0) {
        skills.push({
          line: index + 1,
          message: '引用符が正しく閉じられていません。'
        })
      }
    })

    // Rule エラー検出
    // ul/ol の直下チェック
    const ulMatch = currentCode.match(/<ul[^>]*>([\s\S]*?)<\/ul>/gi)
    if (ulMatch) {
      ulMatch.forEach(ul => {
        const content = ul.replace(/<ul[^>]*>|<\/ul>/gi, '')
        if (content.match(/<(?!li|\/li)[a-z]/i)) {
          // E_HTML_INVALID_NESTING に対応
          const errorMapping = getMvpErrorMapping('E_HTML_INVALID_NESTING')
          const relatedNodeIds = errorMapping?.nodeRefs?.map(ref => ref.nodeId) || []
          rules.push({
            message: '`<ul>` の直下には `<li>` だけを入れます。現在は他の要素が入っています。',
            example: '<ul>\n  <li>項目1</li>\n  <li>項目2</li>\n</ul>',
            relatedNodeIds
          })
        }
      })
    }

    if (/<p(?:\s[^>]*)?>[\s\S]*?<strong(?:\s[^>]*)?>[\s\S]*?<\/p>[\s\S]*?<\/strong>/i.test(currentCode)) {
      const errorMapping = getMvpErrorMapping('E_HTML_INVALID_NESTING')
      rules.push({
        message: '`<p>` と `<strong>` の終了タグが交差しています。内側の `<strong>` から閉じてください。',
        example: '<p><strong>重要</strong>なお知らせです。</p>',
        relatedNodeIds: errorMapping?.nodeRefs.map(ref => ref.nodeId) ?? [],
      })
    }

    if (/\b(?:color|font-size)\s*=/.test(currentCode)) {
      const errorMapping = getMvpErrorMapping('E_CSS_SYNTAX_MISSING_SEMICOLON')
      skills.push({
        message: 'CSSのプロパティと値は `=` ではなく `:` で区切ります。',
        relatedNodeIds: errorMapping?.nodeRefs.map(ref => ref.nodeId) ?? [],
      })
    }

    // 基本構造チェック
    if (!currentCode.includes('<!DOCTYPE html>')) {
      rules.push({
        message: '`<!DOCTYPE html>` 宣言がありません。HTMLファイルの先頭に追加してください。'
      })
    }
    if (!currentCode.includes('<html>') || !currentCode.includes('</html>')) {
      rules.push({
        message: '`<html>` タグが不足しています。'
      })
    }
    if (!currentCode.includes('<head>') || !currentCode.includes('</head>')) {
      rules.push({
        message: '`<head>` セクションが必要です。'
      })
    }
    if (!currentCode.includes('<body>') || !currentCode.includes('</body>')) {
      rules.push({
        message: '`<body>` セクションが必要です。'
      })
    }

    // Knowledge エラー検出
    // h1タグの複数使用チェック
    const h1Count = (currentCode.match(/<h1[^>]*>/gi) || []).length
    if (h1Count > 1) {
      // E_HTML_HEADING_STRUCTURE に対応
      const errorMapping = getMvpErrorMapping('E_HTML_HEADING_STRUCTURE')
      const relatedNodeIds = errorMapping?.nodeRefs?.map(ref => ref.nodeId) || []
      knowledge.push({
        message: `このページには \`<h1>\` が${h1Count}つあります。ページの主題となる見出しは1つにするのが望ましいです。`,
        relatedNodeIds
      })
    }

    // 見出しの階層チェック
    const hasH1 = currentCode.includes('<h1')
    const hasH3 = currentCode.includes('<h3')
    if (hasH3 && !hasH1) {
      // E_HTML_HEADING_STRUCTURE に対応
      const errorMapping = getMvpErrorMapping('E_HTML_HEADING_STRUCTURE')
      const relatedNodeIds = errorMapping?.nodeRefs?.map(ref => ref.nodeId) || []
      knowledge.push({
        message: 'h3タグを使う前に、h1タグから順番に使用することが推奨されます。',
        relatedNodeIds
      })
    }

    // alt属性のチェック
    const imgWithoutAlt = currentCode.match(/<img(?![^>]*alt=)[^>]*>/gi)
    if (imgWithoutAlt && imgWithoutAlt.length > 0) {
      // E_HTML_MISSING_REQUIRED_ATTR に対応
      const errorMapping = getMvpErrorMapping('E_HTML_MISSING_REQUIRED_ATTR')
      const relatedNodeIds = errorMapping?.nodeRefs?.map(ref => ref.nodeId) || []
      knowledge.push({
        message: '画像タグ（img）には、アクセシビリティのためalt属性を追加することが推奨されます。',
        relatedNodeIds
      })
    }

    setSkillErrors(skills.slice(0, 3)) // 最大3件まで表示
    setRuleErrors(rules.slice(0, 3))
    setKnowledgeErrors(knowledge.slice(0, 3))
  }, [])

  // コードが変更されたら自動的に解析
  useEffect(() => {
    analyzeCode(code)
  }, [analyzeCode, code])

  const runCode = useCallback(() => {
    const result = evaluatePracticeCode(challenge.nodeId, code)
    const failedConditions = result.conditionResults.filter(condition => condition.passed === false)

    setEvaluation(result)

    if (result.automaticChecksPassed) {
      setFeedback({
        type: 'success',
        message: '限定自動判定の条件を満たしました。表示確認の条件はプレビューで確認してください。'
      })
      setIsCompleted(true)
    } else {
      setFeedback({
        type: 'warning',
        message: `未達成: ${failedConditions.map(condition => condition.label).join('、')}`
      })
      setIsCompleted(false)
    }
  }, [challenge.nodeId, code])

  // キーボードショートカット: Ctrl/Cmd+Enter でコード実行
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter または Cmd+Enter でコード実行
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        runCode()
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [runCode])

  const resetCode = () => {
    setCode(startingCode)
    setFeedback(null)
    setIsCompleted(false)
    setEvaluation(null)
  }

  // 簡易プレビュー生成
  const previewContent = code.replace(/<!DOCTYPE html>|<html>|<\/html>/g, '')

  // エラーに基づく推奨ノードの取得
  const getRecommendationsFromErrors = () => {
    const detectedErrorIds: string[] = []
    
    // 検出されたエラーに基づいてエラーIDを特定
    if (skillErrors.length > 0) {
      if (skillErrors.some(e => e.message.includes('閉じられていません'))) {
        detectedErrorIds.push('E_HTML_MISSING_CLOSING_TAG')
      }
      if (skillErrors.some(e => e.message.includes('`;`'))) {
        detectedErrorIds.push('E_CSS_SYNTAX_MISSING_SEMICOLON')
      }
      if (skillErrors.some(e => e.message.includes('`=` ではなく `:`'))) {
        detectedErrorIds.push('E_CSS_SYNTAX_MISSING_SEMICOLON')
      }
    }
    
    if (ruleErrors.length > 0) {
      if (ruleErrors.some(e => (
        e.message.includes('`<ul>`') || e.message.includes('終了タグが交差')
      ))) {
        detectedErrorIds.push('E_HTML_INVALID_NESTING')
      }
    }
    
    if (knowledgeErrors.length > 0) {
      if (knowledgeErrors.some(e => e.message.includes('<h1>'))) {
        detectedErrorIds.push('E_HTML_HEADING_STRUCTURE')
      }
      if (knowledgeErrors.some(e => e.message.includes('階層'))) {
        detectedErrorIds.push('E_HTML_HEADING_STRUCTURE')
      }
      if (knowledgeErrors.some(e => e.message.includes('alt'))) {
        detectedErrorIds.push('E_HTML_MISSING_REQUIRED_ATTR')
      }
    }
    
    // エラーマッピングから推奨ノードを取得
    const recommendations = [...new Set(detectedErrorIds)].map(errorId => {
      return getMvpErrorMapping(errorId)
    }).filter(Boolean)
    
    // 優先順位でソート（knowledge > rule > skill）
    recommendations.sort((a, b) => {
      const srkOrder = { knowledge: 3, rule: 2, skill: 1 }
      const aScore = srkOrder[a!.srk as keyof typeof srkOrder] || 0
      const bScore = srkOrder[b!.srk as keyof typeof srkOrder] || 0
      
      return bScore - aScore
    })
    
    return recommendations
  }

  const recommendations = getRecommendationsFromErrors()
  
  const recommendNodeIds = [
    ...new Set(
      recommendations.flatMap(r =>
        (r?.nodeRefs || [])
          .filter(ref => ref.priority === 1 && isMvpNodeId(ref.nodeId))
          .map(ref => ref.nodeId)
      )
    ),
  ]
  const relatedNodeIds = [
    ...new Set(
      recommendations.flatMap(r =>
        (r?.nodeRefs || [])
          .filter(ref => ref.priority > 1 && isMvpNodeId(ref.nodeId))
          .map(ref => ref.nodeId)
      )
    ),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            {/* 左：ロゴ */}
            <div className="flex items-center gap-2">
              <Code className="w-6 h-6 text-primary" />
              <span className="text-xl">CodePath</span>
            </div>
            
            {/* 中央：タイトル */}
            <h1 className="text-xl absolute left-1/2 transform -translate-x-1/2">{challenge.title}</h1>
            
            {/* 右：ユーザー情報 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">学習者</span>
            </div>
          </div>
          
          {/* プログレスバー */}
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Lesson 3 / 10</span>
              <span>30%</span>
            </div>
            <Progress value={30} className="h-2" />
          </div>
        </div>
      </div>

      {/* メインコンテンツ：3カラムレイアウト */}
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* 左カラム：課題パネル (25%) */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">課題内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{challenge.description}</p>

                <div className="rounded border bg-blue-50 p-2">
                  <h4 className="mb-1 text-xs">学習目標</h4>
                  <p className="text-xs text-muted-foreground">{challenge.learningObjective}</p>
                </div>
                
                <div>
                  <h4 className="text-xs mb-2">必要要件</h4>
                  <ul className="space-y-1.5">
                    {challenge.requirements.map((req, index) => (
                      <li 
                        key={index} 
                        className="flex items-start gap-2 cursor-pointer"
                        onClick={() => {
                          const newChecklist = [...checklist]
                          newChecklist[index] = !newChecklist[index]
                          setChecklist(newChecklist)
                        }}
                      >
                        {checklist[index] ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-xs">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 text-xs">完了条件</h4>
                  <ul className="space-y-1.5">
                    {challenge.completionConditions.map(condition => {
                      const result = evaluation?.conditionResults.find(item => item.id === condition.id)
                      const status = result?.passed

                      return (
                        <li key={condition.id} className="flex items-start gap-2 text-xs">
                          {status === true ? (
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                          ) : status === false ? (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                          ) : (
                            <Square className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          )}
                          <span>
                            {condition.label}
                            <Badge variant="outline" className="ml-1 h-4 py-0 text-[10px]">
                              {condition.mode === 'limited-automatic' ? '限定自動判定' : '表示確認'}
                            </Badge>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  {evaluation && (
                    <p className="mt-2 text-[11px] text-muted-foreground">{evaluation.note}</p>
                  )}
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer">許容条件と想定エラー</summary>
                  <div className="mt-2 space-y-2 text-muted-foreground">
                    <ul className="list-disc space-y-1 pl-4">
                      {challenge.acceptedSolutionConditions.map(condition => (
                        <li key={condition}>{condition}</li>
                      ))}
                    </ul>
                    {challenge.expectedErrors.map(error => (
                      <div key={`${error.label}-${error.errorId ?? 'unsupported'}`} className="rounded border bg-gray-50 p-2">
                        <div>{error.label}</div>
                        <div>
                          {error.errorId ?? '既存エラーIDなし'} / {error.mappingStatus} / {error.srk}
                        </div>
                        <div>
                          復習先: {error.reviewNodeIds.length > 0 ? error.reviewNodeIds.join(', ') : 'MVP内推薦なし'}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
                
                <Separator className="my-2" />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                    <h4 className="text-xs">ヒント</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {challenge.hints.slice(0, visibleHints).map((hint, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {hint}
                      </li>
                    ))}
                  </ul>
                  {visibleHints < challenge.hints.length && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => setVisibleHints(visibleHints + 1)}
                    >
                      ヒントをもう一つ見る
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 中央カラム：コードエディタ + プレビュー（上下配置） (45%) */}
          <div className="lg:col-span-5 space-y-3">
            {/* コードエディタ */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">コードエディタ</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetCode}>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      初期状態へ戻す
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={runCode}>
                      <Play className="mr-1 h-3 w-3" />
                      条件を確認
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {feedback && (
                <div
                  className={`mx-3 mb-2 rounded border p-2 text-xs ${
                    feedback.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : feedback.type === 'error'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                  role="status"
                >
                  {feedback.message}
                </div>
              )}
              <CardContent className="p-0">
                {/* タブ風ラベル */}
                <div className="px-3 pt-1.5 pb-0 bg-gray-50 border-b">
                  <Badge variant="secondary" className="text-xs py-0 h-5">index.html</Badge>
                </div>
                
                {/* エディタエリア */}
                <div className="relative">
                  <Textarea
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      setFeedback(null)
                      setEvaluation(null)
                      setIsCompleted(false)
                    }}
                    className="min-h-[220px] font-mono text-xs border-0 resize-none rounded-none bg-gray-50 pl-10"
                    placeholder="HTMLコードをここに入力..."
                    style={{ lineHeight: '1.5' }}
                  />
                  {/* 行番号 */}
                  <div className="absolute top-0 left-0 w-10 min-h-[220px] bg-gray-100 border-r text-right pr-2 pt-2 text-xs text-muted-foreground font-mono select-none pointer-events-none" style={{ lineHeight: '1.5' }}>
                    {code.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* プレビュー */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">プレビュー</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* 簡易ブラウザ枠 */}
                <div className="border-b bg-gray-100 px-2 py-1.5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-muted-foreground">
                    localhost:3000
                  </div>
                </div>
                <div className="h-[220px] bg-white overflow-auto p-3">
                  <iframe
                    srcDoc={code}
                    className="w-full h-full border-0"
                    title="Code Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右カラム：エラー分析 + 関連リソース (30%) */}
          <div className="lg:col-span-4 space-y-3">
            {/* エラー分析パネル（SRK） */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">エラー分析（SRK）</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <Tabs value={srkTab} onValueChange={setSrkTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-2 h-8">
                    <TabsTrigger value="overview" className="text-xs py-1">概要</TabsTrigger>
                    <TabsTrigger value="skill" className="text-xs py-1">Skill</TabsTrigger>
                    <TabsTrigger value="rule" className="text-xs py-1">Rule</TabsTrigger>
                    <TabsTrigger value="knowledge" className="text-xs py-1">Knowledge</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      現在のエラー：Skill {skillErrors.length}件 / Rule {ruleErrors.length}件 / Knowledge {knowledgeErrors.length}件
                    </p>
                    {(skillErrors.length === 0 && ruleErrors.length === 0 && knowledgeErrors.length === 0) ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        エラーは検出されませんでした！
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                        {skillErrors.slice(0, 2).map((error, index) => (
                          <div key={index} className="p-2 bg-red-50 rounded border">
                            <div className="flex items-start gap-2 mb-1">
                              <Badge variant="destructive" className="text-xs py-0 h-4">Skill</Badge>
                              <span className="text-xs flex-1">{error.message}</span>
                            </div>
                            {error.relatedNodeIds && error.relatedNodeIds.length > 0 && onStartLearning && (
                              (() => {
                                const relatedNode = learningNodesArray.find(n => n.id === error.relatedNodeIds![0])
                                return relatedNode ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-6 mt-1"
                                    onClick={() => onStartLearning(error.relatedNodeIds![0])}
                                  >
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {relatedNode.title}
                                  </Button>
                                ) : null
                              })()
                            )}
                          </div>
                        ))}
                        {ruleErrors.slice(0, 2).map((error, index) => (
                          <div key={index} className="p-2 bg-orange-50 rounded border">
                            <div className="flex items-start gap-2 mb-1">
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 py-0 h-4">Rule</Badge>
                              <span className="text-xs flex-1">{error.message}</span>
                            </div>
                            {error.relatedNodeIds && error.relatedNodeIds.length > 0 && onStartLearning && (
                              (() => {
                                const relatedNode = learningNodesArray.find(n => n.id === error.relatedNodeIds![0])
                                return relatedNode ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-6 mt-1"
                                    onClick={() => onStartLearning(error.relatedNodeIds![0])}
                                  >
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {relatedNode.title}
                                  </Button>
                                ) : null
                              })()
                            )}
                          </div>
                        ))}
                        {knowledgeErrors.slice(0, 2).map((error, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded border">
                            <div className="flex items-start gap-2 mb-1">
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 py-0 h-4">Knowledge</Badge>
                              <span className="text-xs flex-1">{error.message}</span>
                            </div>
                            {error.relatedNodeIds && error.relatedNodeIds.length > 0 && onStartLearning && (
                              (() => {
                                const relatedNode = learningNodesArray.find(n => n.id === error.relatedNodeIds![0])
                                return relatedNode ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-6 mt-1"
                                    onClick={() => onStartLearning(error.relatedNodeIds![0])}
                                  >
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {relatedNode.title}
                                  </Button>
                                ) : null
                              })()
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="skill" className="space-y-2 mt-2 max-h-[180px] overflow-y-auto">
                    <h5 className="text-xs">Skillエラー（タイピングや記号の抜けなど）</h5>
                    {skillErrors.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        Skillエラーは検出されませんでした！
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {skillErrors.map((error, index) => (
                          <div key={index} className="p-2 border rounded-lg bg-red-50">
                            {error.line && (
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs py-0 h-4">Line {error.line}</Badge>
                              </div>
                            )}
                            <p className="text-xs mb-2">{error.message}</p>
                            {error.relatedNodeIds && error.relatedNodeIds.length > 0 && onStartLearning && (() => {
                              const relatedNode = learningNodesArray.find(n => n.id === error.relatedNodeIds![0])
                              if (!relatedNode) return null
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs h-6"
                                  onClick={() => onStartLearning(error.relatedNodeIds![0])}
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {relatedNode.title}
                                </Button>
                              )
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="rule" className="space-y-2 mt-2 max-h-[180px] overflow-y-auto">
                    <h5 className="text-xs">Ruleエラー（HTML/CSSの文法ルールの誤り）</h5>
                    {ruleErrors.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        Ruleエラーは検出されませんでした！
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ruleErrors.map((error, index) => (
                          <div key={index} className="p-2 border rounded-lg bg-orange-50">
                            {error.line && (
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs py-0 h-4">Line {error.line}</Badge>
                              </div>
                            )}
                            <p className="text-xs mb-1.5">{error.message}</p>
                            {error.example && (
                              <div className="bg-white p-1.5 rounded border text-xs font-mono mt-1.5 mb-2">
                                {error.example.split('\n').map((line, i) => (
                                  <div key={i} className={line.startsWith('  ') ? 'pl-4' : ''}>{line.replace(/^  /, '')}</div>
                                ))}
                              </div>
                            )}
                            {error.relatedNodeIds && error.relatedNodeIds.length > 0 && onStartLearning && (() => {
                              const relatedNode = learningNodesArray.find(n => n.id === error.relatedNodeIds![0])
                              if (!relatedNode) return null
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs h-6"
                                  onClick={() => onStartLearning(error.relatedNodeIds![0])}
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {relatedNode.title}
                                </Button>
                              )
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="knowledge" className="space-y-2 mt-2 max-h-[180px] overflow-y-auto">
                    <h5 className="text-xs">Knowledgeエラー（概念的な理解不足）</h5>
                    {knowledgeErrors.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        Knowledgeエラーは検出されませんでした！
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {knowledgeErrors.map((error, index) => (
                          <div key={index} className="p-2 border rounded-lg bg-blue-50">
                            {error.line && (
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs py-0 h-4">Line {error.line}</Badge>
                              </div>
                            )}
                            <p className="text-xs mb-2">{error.message}</p>
                            {error.relatedNodeIds && error.relatedNodeIds.length > 0 && onStartLearning && (() => {
                              const relatedNode = learningNodesArray.find(n => n.id === error.relatedNodeIds![0])
                              if (!relatedNode) return null
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs h-6"
                                  onClick={() => onStartLearning(error.relatedNodeIds![0])}
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {relatedNode.title}
                                </Button>
                              )
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 関連リソース */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">関連リソース</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                {currentNode && currentNode.prerequisites && currentNode.prerequisites.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {currentNode.prerequisites.map((prereqId) => {
                        const prereqNode = learningNodesArray.find(n => n.id === prereqId)
                        if (!prereqNode) return null
                        return (
                          <Badge 
                            key={prereqId}
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-xs py-0.5 h-5"
                            onClick={() => setSelectedNodeForPreview(selectedNodeForPreview === prereqId ? null : prereqId)}
                          >
                            {prereqNode.title}
                          </Badge>
                        )
                      })}
                    </div>
                    
                    {/* 選択されたノードの概要表示 */}
                    {selectedNodeForPreview && (() => {
                      const selectedNode = learningNodesArray.find(n => n.id === selectedNodeForPreview)
                      if (!selectedNode) return null
                      return (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-xs font-semibold">{selectedNode.title}</h5>
                            <button
                              onClick={() => setSelectedNodeForPreview(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{selectedNode.summary}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs h-4 py-0">
                              {selectedNode.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs h-4 py-0">
                              {selectedNode.type === 'concept' ? '概念' : 'スキル'}
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-6 text-xs"
                            onClick={() => onStartLearning && onStartLearning(selectedNodeForPreview)}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            この単元を復習する
                          </Button>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">この課題には前提単元がありません</p>
                )}
              </CardContent>
            </Card>

            {/* 次のおすすめパネル（エラーベース） */}
            {recommendations.length > 0 && (
              <Card className="shadow-sm border-2 border-orange-200 bg-orange-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    次のおすすめ（エラー検出）
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 発生したエラー一覧 */}
                  <div>
                    <h5 className="text-xs mb-2">検出されたエラー</h5>
                    <div className="space-y-1">
                      {recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 p-1.5 bg-white rounded border">
                          <Badge 
                            variant="outline" 
                            className={`text-xs py-0 h-4 flex-shrink-0 ${
                              rec?.srk === 'knowledge' ? 'border-blue-300 text-blue-700' :
                              rec?.srk === 'rule' ? 'border-orange-300 text-orange-700' :
                              'border-red-300 text-red-700'
                            }`}
                          >
                            {rec?.srk?.toUpperCase()}
                          </Badge>
                          <span className="text-xs">{rec?.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 次にやるべき復習（recommendNodeIds） */}
                  {recommendNodeIds.length > 0 && (
                    <div>
                      <h5 className="text-xs mb-2 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-red-600" />
                        次にやるべき復習（優先）
                      </h5>
                      <div className="space-y-1.5">
                        {recommendNodeIds.slice(0, 3).map((nodeId, index) => {
                          const node = learningNodesArray.find(n => n.id === nodeId)
                          if (!node) return null
                          return (
                            <div 
                              key={index}
                              data-recommend-node-id={nodeId}
                              className="p-2 bg-white border-2 border-red-300 rounded hover:bg-red-50 cursor-pointer transition-colors"
                              onClick={() => onStartLearning && onStartLearning(nodeId)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="text-xs">{node.title}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Badge variant="outline" className="text-xs h-4 py-0">
                                      {node.category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {node.difficulty === 'beginner' ? '初級' :
                                       node.difficulty === 'intermediate' ? '中級' : '上級'}
                                    </span>
                                  </div>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 関連単元（relatedNodeIds） */}
                  {relatedNodeIds.length > 0 && (
                    <div>
                      <h5 className="text-xs mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-600" />
                        関連単元（任意）
                      </h5>
                      <div className="space-y-1.5">
                        {relatedNodeIds.filter(id => !recommendNodeIds.includes(id)).slice(0, 2).map((nodeId, index) => {
                          const node = learningNodesArray.find(n => n.id === nodeId)
                          if (!node) return null
                          return (
                            <div 
                              key={index}
                              className="p-2 bg-white border rounded hover:bg-gray-50 cursor-pointer transition-colors text-xs"
                              onClick={() => onStartLearning && onStartLearning(nodeId)}
                            >
                              <div className="flex items-center justify-between">
                                <span>{node.title}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            

            {/* 完了ボタン */}
            {isCompleted && (
              <Button onClick={onComplete} className="w-full" size="lg">
                課題完了
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
