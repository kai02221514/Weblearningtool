import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Trophy, 
  Download, 
  Share2, 
  ExternalLink, 
  Calendar,
  Clock,
  Target,
  Star,
  Users,
  BookOpen,
  ArrowRight
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface CompletionProps {
  onDashboard: () => void
  userData: any
  progress: {
    completedModules: string[]
    totalModules: number
    currentStreak: number
    totalHours: number
    quizScores: number[]
  }
}

const portfolioProjects = [
  {
    title: '自己紹介ページ',
    description: 'HTML/CSSで作成した初めてのWebページ',
    techStack: ['HTML', 'CSS'],
    completed: true
  },
  {
    title: 'レスポンシブサイト',
    description: 'スマホ対応のポートフォリオサイト',
    techStack: ['HTML', 'CSS', 'JavaScript'],
    completed: false
  },
  {
    title: 'インタラクティブWebアプリ',
    description: 'JavaScript を活用した動的なWebアプリケーション',
    techStack: ['HTML', 'CSS', 'JavaScript'],
    completed: false
  }
]

export function Completion({ onDashboard, userData, progress }: CompletionProps) {
  const [activeTab, setActiveTab] = useState('certificate')
  
  const completionDate = new Date().toLocaleDateString('ja-JP')
  const averageScore = progress.quizScores.length > 0 
    ? Math.round(progress.quizScores.reduce((a, b) => a + b, 0) / progress.quizScores.length)
    : 0

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter または スペースキー または Escapeキー でダッシュボードへ戻る
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        onDashboard()
        e.preventDefault()
      }
      
      // 数字キー1-3でタブ切り替え
      const tabOrder = ['certificate', 'portfolio', 'next-steps']
      const num = parseInt(e.key)
      if (num >= 1 && num <= 3) {
        setActiveTab(tabOrder[num - 1])
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onDashboard])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl mb-4">🎉 おめでとうございます！</h1>
          <p className="text-xl text-muted-foreground">
            Web開発の基礎コースを完了しました
          </p>
          <Badge className="mt-4 px-4 py-2 text-base" variant="secondary">
            コース修了者
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* タブナビゲーション */}
            <Card>
              <CardHeader>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('certificate')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm transition-all ${
                      activeTab === 'certificate' 
                        ? 'bg-white shadow-sm text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    修了証
                  </button>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm transition-all ${
                      activeTab === 'portfolio' 
                        ? 'bg-white shadow-sm text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ポートフォリオ
                  </button>
                  <button
                    onClick={() => setActiveTab('next-steps')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm transition-all ${
                      activeTab === 'next-steps' 
                        ? 'bg-white shadow-sm text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    次のステップ
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'certificate' && (
                  <div className="space-y-6">
                    {/* 修了証 */}
                    <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                      <div className="mb-6">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1588690154757-badf4644190f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGxlYXJuaW5nJTIwY29kaW5nJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzU3MjQ3MjcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                          alt="Certificate"
                          className="w-full h-32 object-cover rounded mb-4"
                        />
                      </div>
                      
                      <div className="text-2xl mb-2 text-primary">修了証明書</div>
                      <Separator className="my-4" />
                      
                      <div className="space-y-4 text-left max-w-md mx-auto">
                        <div>
                          <strong>受講者:</strong> {userData?.name || 'ユーザー'}様
                        </div>
                        <div>
                          <strong>コース名:</strong> Web開発基礎コース
                        </div>
                        <div>
                          <strong>修了日:</strong> {completionDate}
                        </div>
                        <div>
                          <strong>学習時間:</strong> {progress.totalHours}時間
                        </div>
                        <div>
                          <strong>平均スコア:</strong> {averageScore}%
                        </div>
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <p className="text-sm text-muted-foreground mb-6">
                        この証明書は、HTML、CSS、JavaScriptの基礎を習得し、
                        実際のWeb開発スキルを身につけたことを証明します。
                      </p>
                      
                      <div className="flex gap-3 justify-center">
                        <Button size="lg">
                          <Download className="w-4 h-4 mr-2" />
                          PDFでダウンロード
                        </Button>
                        <Button variant="outline" size="lg">
                          <Share2 className="w-4 h-4 mr-2" />
                          SNSでシェア
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl mb-4">あなたのポートフォリオ</h3>
                      <p className="text-muted-foreground mb-6">
                        学習を通して作成した作品をポートフォリオサイトとしてまとめました。
                      </p>
                    </div>

                    <div className="space-y-4">
                      {portfolioProjects.map((project, index) => (
                        <Card key={index} className={!project.completed ? 'opacity-60' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg mb-2">{project.title}</h4>
                                <p className="text-muted-foreground mb-3">{project.description}</p>
                                <div className="flex gap-2">
                                  {project.techStack.map((tech) => (
                                    <Badge key={tech} variant="outline" className="text-xs">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="ml-4">
                                {project.completed ? (
                                  <Button variant="outline" size="sm">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    見る
                                  </Button>
                                ) : (
                                  <Badge variant="secondary">制作予定</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="text-center">
                      <Button size="lg" className="mt-4">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        ポートフォリオサイトを見る
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'next-steps' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl mb-4">次のステップ</h3>
                      <p className="text-muted-foreground mb-6">
                        基礎を身につけたあなたに、さらなる学習の選択肢をご提案します。
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <Card className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg mb-2">上級コースに進む</h4>
                            <p className="text-muted-foreground mb-3">
                              React、Vue.js、Node.jsなどのモダンな技術を学んで、本格的なWebアプリケーション開発に挑戦
                            </p>
                            <Button>
                              上級コースを見る
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg mb-2">コミュニティに参加</h4>
                            <p className="text-muted-foreground mb-3">
                              同じ目標を持つ仲間と一緒に学習を続け、実際のプロジェクトに参加してスキルアップ
                            </p>
                            <Button variant="outline">
                              コミュニティを見る
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <Star className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg mb-2">プロ向けサポート</h4>
                            <p className="text-muted-foreground mb-3">
                              キャリアチェンジや転職を目指す方向けのメンタリングプログラムとポートフォリオレビュー
                            </p>
                            <Button variant="outline">
                              詳細を見る
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* サイドバー統計 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">学習成果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl text-blue-600">
                      {progress.completedModules.length}
                    </div>
                    <div className="text-sm text-muted-foreground">単元完了</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl text-green-600">
                      {progress.totalHours}
                    </div>
                    <div className="text-sm text-muted-foreground">学習時間</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl text-purple-600">
                      {averageScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">平均スコア</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                    <div className="text-2xl text-yellow-600">
                      {progress.currentStreak}
                    </div>
                    <div className="text-sm text-muted-foreground">連続学習日</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">おめでとうメッセージ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  <div className="text-4xl">🌟</div>
                  <p className="text-sm leading-relaxed">
                    {userData?.name || 'あなた'}さん、本当にお疲れ様でした！
                    
                    継続的な学習により、Web開発の基礎をしっかりと身につけることができました。
                    
                    これからも学び続けて、素晴らしいWebサイトやアプリケーションを作っていってください。
                  </p>
                  <Separator className="my-4" />
                  <p className="text-xs text-muted-foreground">
                    学習プラットフォーム運営チーム一同
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button onClick={onDashboard} variant="outline" className="w-full">
                ダッシュボードに戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}