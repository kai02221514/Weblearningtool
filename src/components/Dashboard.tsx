import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  BookOpen, 
  CheckCircle, 
  Trophy, 
  TrendingUp, 
  Target,
  PlayCircle,
  MessageCircle,
  AlertCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import { getMvpLearningNodes } from '../domain/mvpScope'
import type { RouteGenerationResult } from '../domain/routeGeneration'
import {
  formatRouteWarning,
  getPresentedRecommendations,
  getRouteStatusMessage,
} from '../features/route/routePresentation'

interface DashboardProps {
  onStartLearning: (module: string) => void
  onViewCompletion: () => void
  onViewReflections: () => void
  onTakeSurvey: () => void
  userData: { name?: string } | null
  progress: {
    completedNodeIds: string[]
    totalNodes: number
    currentStreak: number
    totalHours: number
    quizScores: number[]
    reflections: unknown[]
    assumedNodeIds: string[]
    inProgressNodeId: string | null
  }
  routeResult: RouteGenerationResult
}

const learningNodesArray = getMvpLearningNodes()

export function Dashboard({
  onStartLearning,
  onViewCompletion,
  onViewReflections,
  onTakeSurvey,
  userData,
  progress,
  routeResult,
}: DashboardProps) {
  const overallProgress = (progress.completedNodeIds.length / progress.totalNodes) * 100
  const averageQuizScore = progress.quizScores.length > 0 
    ? Math.round(progress.quizScores.reduce((a, b) => a + b, 0) / progress.quizScores.length)
    : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600'
      case 'intermediate': return 'text-yellow-600'
      case 'advanced': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // 前提条件のチェック
  const checkPrerequisites = (nodeId: string) => {
    const node = learningNodesArray.find(n => n.id === nodeId)
    if (!node) return { met: true, unmetNodes: [] }
    
    const prerequisites = node.prerequisites || []
    const unmetNodes = prerequisites.filter(
      prereq => !progress.completedNodeIds.includes(prereq)
        && !progress.assumedNodeIds.includes(prereq)
    )
    
    return {
      met: unmetNodes.length === 0,
      unmetNodes: unmetNodes.map(id => 
        learningNodesArray.find(n => n.id === id)?.title || id
      )
    }
  }

  const recommendations = getPresentedRecommendations(routeResult)
  const recommendedNodeIds = new Set(recommendations.map(item => item.node.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="text-lg">
                  {userData?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl">おかえりなさい、{userData?.name || 'ユーザー'}さん！</h1>
                <p className="text-muted-foreground">今日も学習を続けましょう</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onTakeSurvey} variant="outline">
                <Target className="w-4 h-4 mr-2" />
                診断に回答・再回答
              </Button>
              <Button onClick={onViewReflections} variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                学習の振り返り
              </Button>
              <Button onClick={onViewCompletion} variant="outline">
                <Trophy className="w-4 h-4 mr-2" />
                成果を見る
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* 全体進捗 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  学習進捗
                </CardTitle>
                <CardDescription>
                  あなたの学習の進み具合を確認できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">全体の進捗</span>
                  <span className="text-sm">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="w-full" />
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{progress.completedNodeIds.length}</div>
                    <div className="text-sm text-muted-foreground">完了ノード</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">{progress.currentStreak}</div>
                    <div className="text-sm text-muted-foreground">連続学習日数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">{progress.totalHours}</div>
                    <div className="text-sm text-muted-foreground">総学習時間</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 学習モジュール */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  学習モジュール
                </CardTitle>
                <CardDescription>
                  段階的にWebプログラミングをマスターしましょう
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* routeGeneratorが返した生成順を保つ上位3件 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">現在のおすすめルート</h3>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                      上位{routeResult.presentedCount}件
                    </Badge>
                  </div>

                  <p className={`text-sm mb-3 ${
                    routeResult.status === 'error' ? 'text-red-800' :
                    routeResult.status === 'completed' ? 'text-green-800' :
                    routeResult.status === 'insufficient-input' ? 'text-amber-800' :
                    'text-muted-foreground'
                  }`}>
                    {getRouteStatusMessage(routeResult.status)}
                  </p>

                  {routeResult.warnings.length > 0 && (
                    <div className="space-y-1 mb-3" role="status">
                      {routeResult.warnings.map(warning => (
                        <div key={warning} className="flex items-start gap-2 text-sm text-amber-800">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{formatRouteWarning(warning)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {recommendations.length > 0 && (
                    <div className="space-y-3">
                      {recommendations.map((recommendation, index) => (
                        <div
                          key={recommendation.node.id}
                          className={`p-3 bg-white rounded-lg border-2 ${
                            index === 0 ? 'border-blue-400 shadow-md' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className="bg-blue-600 text-white">{recommendation.order}番目</Badge>
                                <h4 className="font-medium">{recommendation.node.title}</h4>
                              </div>
                              <div className="space-y-2">
                                {recommendation.reasons.map(reason => (
                                  <div key={`${reason.reasonCode}:${reason.evidenceKind}:${reason.evidenceRefId}`} className="text-sm">
                                    <p>{reason.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {reason.reasonCode} / evidence: {reason.evidenceKind} / {reason.evidenceRefId}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Button
                              onClick={() => onStartLearning(recommendation.node.id)}
                              size="sm"
                              variant={index === 0 ? 'default' : 'outline'}
                            >
                              {index === 0 && <ArrowRight className="w-4 h-4 mr-1" />}
                              開始
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 全学習モジュール一覧 */}
                {(() => {
                  // ノードをステータスで分類
                  const availableNodes: Array<{ node: typeof learningNodesArray[number], status: string, prereqCheck: ReturnType<typeof checkPrerequisites> }> = []
                  const lockedNodes: Array<{ node: typeof learningNodesArray[number], status: string, prereqCheck: ReturnType<typeof checkPrerequisites> }> = []
                  
                  learningNodesArray.forEach((node) => {
                    const isCompleted = (progress.completedNodeIds || []).includes(node.id)
                    const isRecommended = recommendedNodeIds.has(node.id)
                    const prereqCheck = checkPrerequisites(node.id)
                    const status = isCompleted ? 'completed' : 
                                  isRecommended ? 'current' : 
                                  !prereqCheck.met ? 'locked' : 'available'
                    
                    if (status === 'available') {
                      availableNodes.push({ node, status, prereqCheck })
                    } else if (status === 'locked') {
                      lockedNodes.push({ node, status, prereqCheck })
                    }
                  })
                  
                  // 利用可能な全てとロック中の3件を結合
                  const displayNodes = [...availableNodes, ...lockedNodes.slice(0, 3)]
                  
                  return displayNodes.map(({ node, status, prereqCheck }) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : status === 'current' ? (
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{node.title}</h3>
                          <p className="text-sm text-muted-foreground">{node.summary}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getStatusColor(status)}>
                              {status === 'completed' ? '完了' : 
                               status === 'current' ? '学習中' : 
                               status === 'locked' ? 'ロック中' : '利用可能'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {node.type === 'concept' ? '概念' : 'スキル'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => onStartLearning(node.id)}
                        disabled={status === 'locked'}
                        variant={status === 'current' ? 'default' : 'outline'}
                      >
                        {status === 'completed' ? '復習する' :
                         status === 'current' ? '続ける' : 
                         status === 'locked' ? 'ロック中' : '開始'}
                      </Button>
                    </div>
                  ))
                })()}
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 今週の目標 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  今週の目標
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CSSの基礎完了</span>
                    <span className="text-sm text-blue-600">進行中</span>
                  </div>
                  <Progress value={65} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">1日30分学習</span>
                    <span className="text-sm text-green-600">達成</span>
                  </div>
                  <Progress value={100} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* 最近の成績 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  最近の成績
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">平均スコア</span>
                    <span className="text-lg">{averageQuizScore}点</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">最高スコア</span>
                    <span className="text-lg">{Math.max(...progress.quizScores, 0)}点</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">テスト回数</span>
                    <span className="text-lg">{progress.quizScores.length}回</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
