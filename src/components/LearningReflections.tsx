import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  BookOpen,
  Lightbulb,
  Target,
  MessageSquare
} from 'lucide-react'

interface ReflectionData {
  nodeId: string
  nodeName: string
  date: string
  struggledConcepts: string[]
  reflection: string
  quickTestResult: boolean
  recommendations: string[]
}

interface LearningReflectionsProps {
  onDashboard: () => void
  reflections: ReflectionData[]
}

export function LearningReflections({ onDashboard, reflections }: LearningReflectionsProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button onClick={onDashboard} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              ダッシュボードに戻る
            </Button>
            <div>
              <h1 className="text-2xl">学習の振り返り履歴</h1>
              <p className="text-muted-foreground">過去の学習記録とつまずきポイントを確認しましょう</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {reflections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">まだ振り返りデータがありません</h3>
              <p className="text-muted-foreground mb-4">
                学習モジュールを完了すると、ここに振り返りが記録されます
              </p>
              <Button onClick={onDashboard}>
                学習を始める
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 統計情報 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-2xl mb-1">{reflections.length}</div>
                  <div className="text-sm text-muted-foreground">振り返り回数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-2xl mb-1">
                    {reflections.filter(r => r.quickTestResult).length}
                  </div>
                  <div className="text-sm text-muted-foreground">理解度テスト正解</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-2xl mb-1">
                    {reflections.reduce((total, r) => total + r.struggledConcepts.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">つまずいた概念数</div>
                </CardContent>
              </Card>
            </div>

            {/* 振り返り履歴 */}
            <div className="space-y-4">
              {reflections.map((reflection, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{reflection.nodeName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {reflection.date}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={reflection.quickTestResult ? "default" : "secondary"}>
                        {reflection.quickTestResult ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        理解度テスト{reflection.quickTestResult ? '正解' : '不正解'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* つまずいた概念 */}
                    {reflection.struggledConcepts.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <h4 className="font-medium text-red-700">つまずいた概念</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {reflection.struggledConcepts.map((concept, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 学習者の振り返り */}
                    {reflection.reflection && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium text-blue-700">あなたの振り返り</h4>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-900">{reflection.reflection}</p>
                        </div>
                      </div>
                    )}

                    {/* 推奨される次のアクション */}
                    {reflection.recommendations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          <h4 className="font-medium text-yellow-700">推奨アクション</h4>
                        </div>
                        <div className="space-y-2">
                          {reflection.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-yellow-800">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {reflection.struggledConcepts.length === 0 && (
                      <div className="text-center py-4">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-green-700 font-medium">
                          この学習では特につまずきはありませんでした！
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* よくつまずく概念の分析 */}
            {reflections.length > 1 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    学習パターン分析
                  </CardTitle>
                  <CardDescription>
                    あなたの学習傾向を分析して、効果的な学習をサポートします
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">つまずきやすい分野</h4>
                      <div className="space-y-2">
                        {(() => {
                          const conceptCounts: { [key: string]: number } = {}
                          reflections.forEach(r => {
                            r.struggledConcepts.forEach(concept => {
                              conceptCounts[concept] = (conceptCounts[concept] || 0) + 1
                            })
                          })
                          
                          const sortedConcepts = Object.entries(conceptCounts)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                          
                          return sortedConcepts.length > 0 ? sortedConcepts.map(([concept, count]) => (
                            <div key={concept} className="flex justify-between items-center">
                              <span className="text-sm">{concept}</span>
                              <Badge variant="outline">{count}回</Badge>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground">
                              つまずきが少なく、順調に学習が進んでいます！
                            </p>
                          )
                        })()}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">学習成果</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">理解度テスト正答率</span>
                          <span className="text-sm font-medium">
                            {Math.round((reflections.filter(r => r.quickTestResult).length / reflections.length) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">振り返り記録率</span>
                          <span className="text-sm font-medium">
                            {Math.round((reflections.filter(r => r.reflection.length > 0).length / reflections.length) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">完全理解モジュール</span>
                          <span className="text-sm font-medium">
                            {reflections.filter(r => r.struggledConcepts.length === 0 && r.quickTestResult).length}個
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* アクションボタン */}
            <div className="text-center pt-8">
              <Button onClick={onDashboard} size="lg">
                <BookOpen className="w-4 h-4 mr-2" />
                学習を続ける
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
