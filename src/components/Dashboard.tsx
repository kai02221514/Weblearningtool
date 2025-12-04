import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Target,
  PlayCircle,
  Award,
  Users,
  MessageCircle
} from 'lucide-react'

interface DashboardProps {
  onStartLearning: (module: string) => void
  onViewCompletion: () => void
  onViewReflections: () => void
  userData: any
  progress: {
    completedModules: string[]
    totalModules: number
    currentStreak: number
    totalHours: number
    quizScores: number[]
    reflections: any[]
  }
}

const modules = [
  {
    id: 'html-basics',
    title: 'HTMLの基礎',
    description: 'Webページの構造を作る基本的なHTMLタグを学びます',
    status: 'completed',
    duration: '2時間',
    difficulty: 'beginner'
  },
  {
    id: 'css-basics',
    title: 'CSSの基礎',
    description: 'Webページのスタイリングとレイアウトを学びます',
    status: 'current',
    duration: '3時間',
    difficulty: 'beginner'
  },
  {
    id: 'css-layout',
    title: 'CSSレイアウト',
    description: 'FlexboxやGridを使った現代的なレイアウト手法を学びます',
    status: 'locked',
    duration: '4時間',
    difficulty: 'intermediate'
  },
  {
    id: 'javascript-intro',
    title: 'JavaScript入門',
    description: '動的なWebページを作るためのJavaScriptの基礎を学びます',
    status: 'locked',
    duration: '5時間',
    difficulty: 'intermediate'
  },
  {
    id: 'responsive-design',
    title: 'レスポンシブデザイン',
    description: 'モバイルファーストな設計とメディアクエリを学びます',
    status: 'locked',
    duration: '3時間',
    difficulty: 'advanced'
  }
]

const achievements = [
  { title: '初回ログイン', description: 'プログラミング学習の第一歩', earned: true, icon: '🎯' },
  { title: '最初のモジュール完了', description: 'HTMLの基礎をマスター', earned: true, icon: '📚' },
  { title: '3日連続学習', description: '継続は力なり', earned: true, icon: '🔥' },
  { title: '平均スコア85点以上', description: '理解度の高い学習', earned: false, icon: '⭐' },
  { title: 'コードの達人', description: '10個の実践課題をクリア', earned: false, icon: '💻' }
]

export function Dashboard({ onStartLearning, onViewCompletion, onViewReflections, userData, progress }: DashboardProps) {
  const overallProgress = (progress.completedModules.length / progress.totalModules) * 100
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
                    <div className="text-2xl mb-1">{progress.completedModules.length}</div>
                    <div className="text-sm text-muted-foreground">完了モジュール</div>
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
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {module.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : module.status === 'current' ? (
                          <PlayCircle className="w-5 h-5 text-blue-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{module.title}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getStatusColor(module.status)}>
                            {module.status === 'completed' ? '完了' : 
                             module.status === 'current' ? '学習中' : 'ロック中'}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {module.duration}
                          </span>
                          <span className={`text-xs ${getDifficultyColor(module.difficulty)}`}>
                            {module.difficulty === 'beginner' ? '初級' :
                             module.difficulty === 'intermediate' ? '中級' : '上級'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => onStartLearning(module.id)}
                      disabled={module.status === 'locked'}
                      variant={module.status === 'current' ? 'default' : 'outline'}
                    >
                      {module.status === 'completed' ? '復習する' :
                       module.status === 'current' ? '続ける' : 'ロック中'}
                    </Button>
                  </div>
                ))}
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