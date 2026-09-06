import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Textarea } from './ui/textarea'
import {
  MessageCircle,
  Target,
  CheckCircle,
  Home,
  ArrowRight
} from 'lucide-react'
import { LearningFlowProgress } from './LearningFlowProgress'

interface ReflectionData {
  nodeId: string
  nodeName: string
  date: string
  struggledConcepts: string[]
  reflection: string
  quickTestResult: boolean
  recommendations: string[]
}

interface LearningReflectionFormProps {
  onComplete: (reflectionData: ReflectionData) => void
  onDashboard: () => void
  currentNodeId: string
  currentNodeName: string
}

const allConcepts = [
  'HTMLタグの基本的な書き方',
  '文書構造の概念（見出し、段落、リストなど）',
  'HTMLドキュメントの基本構造',
  'よく使用されるタグの用途と使い分け',
  'CSSとHTMLの組み合わせ',
  '実践課題でのコーディング',
  'エラーの原因特定と修正'
]

export function LearningReflectionForm({
  onComplete,
  onDashboard,
  currentNodeId,
  currentNodeName,
}: LearningReflectionFormProps) {
  const [struggledConcepts, setStruggledConcepts] = useState<string[]>([])
  const [reflection, setReflection] = useState('')
  const [completedReflection, setCompletedReflection] = useState<ReflectionData | null>(null)

  const handleSubmit = () => {
    const recommendations = generateRecommendations(struggledConcepts)
    
    const reflectionData: ReflectionData = {
      nodeId: currentNodeId,
      nodeName: currentNodeName,
      date: new Date().toLocaleDateString('ja-JP'),
      struggledConcepts,
      reflection,
      quickTestResult: true,
      recommendations
    }

    setCompletedReflection(reflectionData)
  }

  const generateRecommendations = (concepts: string[]): string[] => {
    const recommendations: string[] = []
    
    if (concepts.length === 0) {
      recommendations.push('このセッションでは、次の推薦単元へ進めます')
    } else {
      if (concepts.some(c => c.includes('HTMLタグ'))) {
        recommendations.push('HTMLタグの練習として、基本的なタグを繰り返し書いてみましょう')
      }
      if (concepts.some(c => c.includes('文書構造'))) {
        recommendations.push('既存のWebサイトのHTMLソースを見て、構造を分析してみましょう')
      }
      if (concepts.some(c => c.includes('実践課題'))) {
        recommendations.push('実践課題を再度チャレンジして、コーディングに慣れましょう')
      }
      recommendations.push(`つまずいた概念「${concepts.join('、')}」の復習をおすすめします`)
    }
    
    return recommendations
  }

  if (completedReflection !== null) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <LearningFlowProgress currentStep="reflection" />
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-9 w-9 text-green-700" />
              </div>
              <CardTitle>{currentNodeName} を完了しました</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-center">
              <p className="text-muted-foreground">
                教材・確認テスト・実践課題・振り返りの4段階が完了しました。
                Dashboardで、このセッションの完了状態と更新後の推薦を確認できます。
              </p>
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                振り返りと学習進捗はこのセッション内だけで保持され、再ログイン後には復元されません。
              </p>
              <Button size="lg" onClick={() => onComplete(completedReflection)}>
                Dashboardで更新後の推薦を見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button onClick={onDashboard} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              ダッシュボード
            </Button>
            <div>
              <h1 className="text-2xl">学習の振り返り</h1>
              <p className="text-muted-foreground">{currentNodeName} - 学習内容の整理</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <LearningFlowProgress currentStep="reflection" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              単元の振り返り
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Alert>
                <Target className="w-4 h-4" />
                <AlertDescription>
                  教材、確認テスト、実践課題を通して学んだことを振り返りましょう。
                  入力内容は現在のセッション内だけで保持されます。
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">つまずいた概念はありましたか？</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      学習・テスト・実践を通して難しく感じた部分があれば選択してください
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {allConcepts.map((concept, index) => (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={struggledConcepts.includes(concept)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStruggledConcepts([...struggledConcepts, concept])
                              } else {
                                setStruggledConcepts(struggledConcepts.filter(c => c !== concept))
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{concept}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">学習の気づきや疑問を記録</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      実践課題での体験も含めて、感じたことを自由に記録してください
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="例：
• HTMLタグの使い分けがまだ曖昧
• 実践課題でエラーが多く出た
• CSSとの組み合わせがどうなるか気になる
• 実際のWebサイトでどう使われているか知りたい"
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      className="min-h-[150px]"
                    />
                    <p className="text-xs text-muted-foreground mt-2">入力は任意です。サーバーへは保存されません。</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  学習サイクル完了！
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  「振り返りを確定する」と、この単元を現在のセッション内で完了にします。
                </p>
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  振り返りを記録して、次の学習に進みましょう
                </p>
                <Button onClick={handleSubmit} size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  振り返りを確定して単元を完了する
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
