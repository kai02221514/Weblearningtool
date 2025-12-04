import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Play, CheckCircle, ArrowRight, Lightbulb, User, Square, BookOpen, Code } from 'lucide-react'

interface PracticeChallengeProps {
  onComplete: () => void
  onDashboard: () => void
}

interface ErrorItem {
  line?: number
  message: string
}

type SkillError = ErrorItem
type RuleError = ErrorItem & { example?: string }
type KnowledgeError = ErrorItem

const initialCode = `<!DOCTYPE html>
<html>
<head>
    <title>私のWebページ</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
    <h1>こんにちは！</h1>
    <p>ここにあなたのメッセージを書いてください。</p>
</body>
</html>`

const challenge = {
  title: '自己紹介ページを作成しよう',
  description: 'HTMLとCSSを使って、あなた自身の自己紹介ページを作成してください。',
  requirements: [
    'h1タグで名前を表示',
    'pタグで自己紹介文を記述',
    'h2タグで「趣味」の見出しを追加',
    'ulタグで趣味のリストを作成',
    'CSSで文字色や背景色をカスタマイズ'
  ],
  hints: [
    'HTMLの基本構造を忘れずに！',
    '<ul><li>...</li></ul>でリストが作れます',
    'CSSのcolorプロパティで文字色を変更できます',
    'background-colorプロパティで背景色を設定できます'
  ]
}

export function PracticeChallenge({ onComplete, onDashboard }: PracticeChallengeProps) {
  const [code, setCode] = useState(initialCode)
  const [feedback, setFeedback] = useState<{type: 'success' | 'warning' | 'error', message: string} | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [srkTab, setSrkTab] = useState('overview')
  const [visibleHints, setVisibleHints] = useState(2)
  const [checklist, setChecklist] = useState([false, false, false, false, false])
  
  // SRKエラーのstate
  const [skillErrors, setSkillErrors] = useState<SkillError[]>([])
  const [ruleErrors, setRuleErrors] = useState<RuleError[]>([])
  const [knowledgeErrors, setKnowledgeErrors] = useState<KnowledgeError[]>([])

  // コード解析関数
  const analyzeCode = (currentCode: string) => {
    const lines = currentCode.split('\n')
    const skills: SkillError[] = []
    const rules: RuleError[] = []
    const knowledge: KnowledgeError[] = []

    // Skill エラー検出
    lines.forEach((line, index) => {
      // 閉じタグの欠落チェック
      const openTags = line.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || []
      
      openTags.forEach(tag => {
        const tagName = tag.match(/<([a-z][a-z0-9]*)/i)?.[1]
        if (tagName && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName.toLowerCase())) {
          const closeTag = `</${tagName}>`
          if (!currentCode.includes(closeTag)) {
            skills.push({
              line: index + 1,
              message: `\`<${tagName}>\` タグが閉じられていません。`
            })
          }
        }
      })

      // セミコロン忘れチェック（CSS内）
      if (line.includes(':') && !line.includes(';') && !line.includes('{') && !line.includes('}')) {
        const inStyle = currentCode.substring(0, currentCode.indexOf(line)).includes('<style>')
        if (inStyle) {
          skills.push({
            line: index + 1,
            message: 'CSSの `;` が抜けています。'
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
          rules.push({
            message: '`<ul>` の直下には `<li>` だけを入れます。現在は他の要素が入っています。',
            example: '<ul>\n  <li>項目1</li>\n  <li>項目2</li>\n</ul>'
          })
        }
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
      knowledge.push({
        message: `このページには \`<h1>\` が${h1Count}つあります。ページの主題となる見出しは1つにするのが望ましいです。`
      })
    }

    // 見出しの階層チェック
    const hasH1 = currentCode.includes('<h1')
    const hasH3 = currentCode.includes('<h3')
    if (hasH3 && !hasH1) {
      knowledge.push({
        message: 'h3タグを使う前に、h1タグから順番に使用することが推奨されます。'
      })
    }

    // alt属性のチェック
    const imgWithoutAlt = currentCode.match(/<img(?![^>]*alt=)[^>]*>/gi)
    if (imgWithoutAlt && imgWithoutAlt.length > 0) {
      knowledge.push({
        message: '画像タグ（img）には、アクセシビリティのためalt属性を追加することが推奨されます。'
      })
    }

    setSkillErrors(skills.slice(0, 3)) // 最大3件まで表示
    setRuleErrors(rules.slice(0, 3))
    setKnowledgeErrors(knowledge.slice(0, 3))
  }

  // コードが変更されたら自動的に解析
  useEffect(() => {
    analyzeCode(code)
  }, [code])

  const runCode = () => {
    // 簡易的なエラーチェックとフィードバック
    const hasH1 = code.includes('<h1>')
    const hasH2 = code.includes('<h2>')
    const hasUL = code.includes('<ul>')
    const hasCSS = code.includes('<style>') || code.includes('color')
    const hasProperStructure = code.includes('<!DOCTYPE html>') && code.includes('<html>') && code.includes('<body>')

    let errors: SkillError[] = []
    let warnings: RuleError[] = []
    let knowledgeErrors: KnowledgeError[] = []
    let completedRequirements = 0

    if (!hasProperStructure) {
      errors.push({ message: 'HTML の基本構造が不完全です' })
    }

    if (hasH1) completedRequirements++
    else warnings.push({ message: 'h1タグで名前を表示してください' })

    if (hasH2) completedRequirements++
    else warnings.push({ message: 'h2タグで見出しを追加してください' })

    if (hasUL) completedRequirements++
    else warnings.push({ message: 'ulタグでリストを作成してください' })

    if (hasCSS) completedRequirements++
    else warnings.push({ message: 'CSSでスタイルを追加してください' })

    if (errors.length > 0) {
      setFeedback({
        type: 'error',
        message: `エラー: ${errors.map(e => e.message).join(', ')}`
      })
    } else if (completedRequirements >= 4) {
      setFeedback({
        type: 'success',
        message: `素晴らしいです！課題を完了しました（${completedRequirements}/4項目達成）`
      })
      setIsCompleted(true)
    } else {
      setFeedback({
        type: 'warning',
        message: `もう少しです！${warnings.map(e => e.message).join('、')}`
      })
    }
  }

  const resetCode = () => {
    setCode(initialCode)
    setFeedback(null)
    setIsCompleted(false)
  }

  // 簡易プレビュー生成
  const previewContent = code.replace(/<!DOCTYPE html>|<html>|<\/html>/g, '')

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

          {/* 中央カラム：コードエディタ + エラーサポート (45%) */}
          <div className="lg:col-span-5 space-y-3">
            {/* コードエディタ */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">コードエディタ</CardTitle>
                  <Button onClick={runCode} size="sm" className="h-7 text-xs">
                    <Play className="w-3 h-3 mr-1" />
                    実行
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* タブ風ラベル */}
                <div className="px-3 pt-1.5 pb-0 bg-gray-50 border-b">
                  <Badge variant="secondary" className="text-xs py-0 h-5">index.html</Badge>
                </div>
                
                {/* エディタエリア */}
                <div className="relative">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="min-h-[280px] font-mono text-xs border-0 resize-none rounded-none bg-gray-50 pl-10"
                    placeholder="HTMLコードをここに入力..."
                    style={{ lineHeight: '1.5' }}
                  />
                  {/* 行番号 */}
                  <div className="absolute top-0 left-0 w-10 min-h-[280px] bg-gray-100 border-r text-right pr-2 pt-2 text-xs text-muted-foreground font-mono select-none pointer-events-none" style={{ lineHeight: '1.5' }}>
                    {code.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <div className="space-y-1.5">
                        {skillErrors.slice(0, 1).map((error, index) => (
                          <div key={index} className="flex items-start gap-2 p-1.5 bg-red-50 rounded text-xs">
                            <Badge variant="destructive" className="text-xs py-0 h-4">Skill</Badge>
                            <span className="text-xs">{error.message}</span>
                          </div>
                        ))}
                        {ruleErrors.slice(0, 1).map((error, index) => (
                          <div key={index} className="flex items-start gap-2 p-1.5 bg-orange-50 rounded text-xs">
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 py-0 h-4">Rule</Badge>
                            <span className="text-xs">{error.message}</span>
                          </div>
                        ))}
                        {knowledgeErrors.slice(0, 1).map((error, index) => (
                          <div key={index} className="flex items-start gap-2 p-1.5 bg-blue-50 rounded text-xs">
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 py-0 h-4">Knowledge</Badge>
                            <span className="text-xs">{error.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="skill" className="space-y-2 mt-2">
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
                            <p className="text-xs">{error.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="rule" className="space-y-2 mt-2">
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
                              <div className="bg-white p-1.5 rounded border text-xs font-mono mt-1.5">
                                {error.example.split('\n').map((line, i) => (
                                  <div key={i} className={line.startsWith('  ') ? 'pl-4' : ''}>{line.replace(/^  /, '')}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="knowledge" className="space-y-2 mt-2">
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
                            <Button variant="outline" size="sm" className="text-xs h-6">
                              <BookOpen className="w-3 h-3 mr-1" />
                              関連単元を復習する
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* 右カラム：プレビュー + 追加サポート (30%) */}
          <div className="lg:col-span-4 space-y-3">
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
                <div className="h-[250px] bg-white overflow-auto p-3">
                  <iframe
                    srcDoc={code}
                    className="w-full h-full border-0"
                    title="Code Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 関連リソース */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">関連リソース</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-xs py-0.5 h-5">
                    HTMLの基本構造
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-xs py-0.5 h-5">
                    リストタグ（ul / li）
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-xs py-0.5 h-5">
                    テキストのスタイル
                  </Badge>
                </div>
              </CardContent>
            </Card>
            

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