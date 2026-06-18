import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Textarea } from './ui/textarea'
import { 
  ArrowLeft,
  MessageCircle,
  Target,
  Lightbulb,
  CheckCircle,
  Home,
  ArrowRight
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

  const handleSubmit = () => {
    const recommendations = generateRecommendations(struggledConcepts)
    
    const reflectionData: ReflectionData = {
      nodeId: currentNodeId,
      nodeName: currentNodeName,
      date: new Date().toLocaleDateString('ja-JP'),
      struggledConcepts,
      reflection,
      quickTestResult: true, // この時点では仮の値
      recommendations
    }

    onComplete(reflectionData)
  }

  const generateRecommendations = (concepts: string[]): string[] => {
    const recommendations: string[] = []
    
    if (concepts.length === 0) {
      recommendations.push('素晴らしい理解度です！次のモジュールに進みましょう')
      recommendations.push('復習として、学んだ概念を使って自分なりのWebページを作ってみましょう')
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
    
    recommendations.push('次のCSSモジュールで、HTMLとスタイリングの組み合わせを学習できます')
    
    return recommendations
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
              <p className="text-muted-foreground">{currentNodeName} - メタ認知の促進</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              フィードバック・振り返り：メタ認知の促進
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Alert>
                <Target className="w-4 h-4" />
                <AlertDescription>
                  学習モジュール、確認テスト、実践課題を通して学んだことを振り返りましょう。正直に回答することで、より効果的な学習が可能になります。
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
                    <p className="text-xs text-muted-foreground mt-2">
                      この内容は今後の復習提案と学習計画に活用されます
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  次回学習への提案（プレビュー）
                </h4>
                <div className="space-y-2 text-sm">
                  {struggledConcepts.length > 0 ? (
                    <>
                      <p>• つまずいた概念「{struggledConcepts.slice(0, 2).join('、')}{struggledConcepts.length > 2 ? '、他' : ''}」の復習をおすすめします</p>
                      {struggledConcepts.some(c => c.includes('実践課題')) && (
                        <p>• 実践課題を再度チャレンジして、コーディングに慣れましょう</p>
                      )}
                    </>
                  ) : (
                    <p>• 素晴らしい理解度です！次のモジュールに進みましょう</p>
                  )}
                  <p>• 次のCSSモジュールで、HTMLとスタイリングの組み合わせを学習できます</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  学習サイクル完了！
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  学習モジュール → 確認テスト → 実践課題 → 振り返りの4段階を完了しました。
                  この振り返りデータは学習履歴に保存され、いつでも確認できます。
                </p>
                <ul className="text-xs text-green-600 space-y-1">
                  <li>• 学習内容の定着度が向上します</li>
                  <li>• 今後の学習計画が最適化されます</li>
                  <li>• メタ認知能力が強化されます</li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  振り返りを記録して、次の学習に進みましょう
                </p>
                <Button onClick={handleSubmit} size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  振り返りを保存してダッシュボードへ
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
