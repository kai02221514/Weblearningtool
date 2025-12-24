import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Home, 
  BookOpen, 
  Target, 
  CheckCircle, 
  Lightbulb, 
  Play, 
  FileText, 
  ArrowRight 
} from 'lucide-react'
import { ImageWithFallback } from "./figma/ImageWithFallback";
import learningNodesData from '../data/learningNodes'

// JSONファイルから配列を取得(デフォルトインポートの型に対応)
const learningNodesArray = (() => {
  if (Array.isArray(learningNodesData)) {
    return learningNodesData
  }
  // 新しいスキーマ構造の場合、html_nodes と css_nodes を結合
  const data = learningNodesData as any
  const htmlNodes = data.html_nodes || []
  const cssNodes = data.css_nodes || []
  return [...htmlNodes, ...cssNodes]
})()

interface LearningModuleProps {
  onComplete: () => void;
  onDashboard: () => void;
  currentModule: string;
}

type LearningPhase = "introduction" | "input";

const learningContent = {
  introduction: {
    title: "HTMLの基礎を学習する目的",
    objectives: [
      "Webページの基本構造を理解する",
      "よく使われるHTMLタグを覚える",
      "実際にWebページを作成できるようになる",
    ],
    realWorldApplication: [
      "企業のホームページ制作",
      "個人ブログやポートフォリオサイト",
      "EコマースサイトやWebアプリの基盤",
    ],
    skillProgression:
      "この単元を完了すると、基本的なWebページを一から作成できるようになります。次のCSS学習でデザインを加えられます。",
    estimatedTime: "約2時間",
    preview:
      "HTML学習後は、文書構造を持った見栄えの良いWebページを作成できます",
  },
  slides: [
    {
      title: "HTMLとは何か？",
      content:
        "HTML（HyperText Markup Language）は、Webページを作るための言語です。文書の構造を定義します。",
      practicalExample:
        "ニュースサイトの記事構造や、企業サイトのナビゲーションメニューもHTMLで作られています。",
    },
    {
      title: "基本的なHTMLタグ",
      content:
        "HTMLは「タグ」という仕組みで文書構造を表現します。例：<h1>見出し</h1>, <p>段落</p>",
      practicalExample:
        "ブログ記事のタイトルには<h1>タグ、本文には<p>タグを使います。",
    },
    {
      title: "HTMLドキュメントの構造",
      content:
        "すべてのHTMLページには決まった構造があります：html, head, bodyの要素で構成されます。",
      practicalExample:
        "どのWebサイトのソースコードを見ても、この基本構造が使われています。",
    },
  ],
  textContent: {
    sections: [
      {
        title: "1. HTMLの基本概念",
        content:
          "HTML（HyperText Markup Language）は、Webページの骨組みを作る言語です。テキストに「マークアップ」を加えることで、ブラウザに文書の構造を伝えます。",
      },
      {
        title: "2. 基本的なタグの使い方",
        content:
          "HTMLタグは < > で囲まれた要素で、多くは開始タグと終了タグのペアで使用します。例：<p>これは段落です</p>",
      },
      {
        title: "3. HTMLドキュメントの構造",
        content:
          "<!DOCTYPE html>, <html>, <head>, <body>などの要素でWebページの基本構造を作ります。この構造はすべてのWebページに共通です。",
      },
    ],
    practicalTips: [
      "タグは正しく閉じることを忘れずに",
      "インデント（字下げ）で構造を見やすくする",
      "コメント機能を活用してコードに説明を残す",
    ],
  },
  keyPoints: [
    "HTMLタグの基本的な書き方",
    "文書構造の概念（見出し、段落、リストなど）",
    "HTMLドキュメントの基本構造",
    "よく使用されるタグの用途と使い分け",
  ],
};

export function LearningModule({
  onComplete,
  onDashboard,
  currentModule,
}: LearningModuleProps) {
  const [currentPhase, setCurrentPhase] =
    useState<LearningPhase>("introduction");
  const [activeTab, setActiveTab] = useState("slides");
  const [slideIndex, setSlideIndex] = useState(0);

  const handlePhaseComplete = () => {
    if (currentPhase === "introduction") {
      setCurrentPhase("input");
    } else if (currentPhase === "input") {
      onComplete();
    }
  };

  const getPhaseProgress = () => {
    switch (currentPhase) {
      case "introduction":
        return 40;
      case "input":
        return 100;
      default:
        return 0;
    }
  };

  // 次の推奨ノードを取得
  const getNextNodes = () => {
    // 仮の現在ノードIDを設定（実際は currentModule から取得）
    const currentNodeId = 'html-basics'
    const completedNodeIds = ['html-basics']
    
    // 前提条件を満たす次のノードを探す
    const nextCandidates = learningNodesArray.filter(node => {
      // 既に完了済みのノードは除外
      if (completedNodeIds.includes(node.id)) return false
      
      // 前提条件を満たしているかチェック
      const prerequisitesMet = node.prerequisites.every(prereq => 
        completedNodeIds.includes(prereq)
      )
      
      return prerequisitesMet
    })
    
    return nextCandidates.slice(0, 3) // 最大3件まで
  }

  const nextNodes = getNextNodes()

  // キーボードナビゲーション（スライド形式のみ）
  useEffect(() => {
    // スライド形式でない場合はリスナーを追加しない
    if (currentPhase !== 'input' || activeTab !== 'slides') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // テキスト入力中は無視
      if (event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLInputElement) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          // 前のスライドへ
          if (slideIndex > 0) {
            setSlideIndex(slideIndex - 1)
          }
          event.preventDefault()
          break
        
        case 'ArrowRight':
          // 次のスライドへ
          if (slideIndex < learningContent.slides.length - 1) {
            setSlideIndex(slideIndex + 1)
          }
          event.preventDefault()
          break
        
        case 'Enter':
          // 最後のスライドならフェーズ完了、それ以外は次のスライドへ
          if (slideIndex === learningContent.slides.length - 1) {
            handlePhaseComplete()
          } else {
            setSlideIndex(slideIndex + 1)
          }
          event.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPhase, activeTab, slideIndex])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onDashboard}
                variant="outline"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                ダッシュボード
              </Button>
              <div>
                <h1 className="text-xl">{currentModule}</h1>
                <p className="text-sm text-muted-foreground">
                  {currentPhase === "introduction" &&
                    "導入フェーズ：学習目的の明確化"}
                  {currentPhase === "input" &&
                    "インプットフェーズ：形式選択と学習"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>学習進捗</span>
              <span>{getPhaseProgress()}%</span>
            </div>
            <Progress
              value={getPhaseProgress()}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 導入フェーズ */}
        {currentPhase === "introduction" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                導入：学習目的の明確化
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1588690154757-badf4644190f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGxlYXJuaW5nJTIwY29kaW5nJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzU3MjQ3MjcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                      alt="HTML Learning Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl mb-4">
                      {learningContent.introduction.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {
                          learningContent.introduction
                            .estimatedTime
                        }
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {learningContent.introduction.preview}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        学習目標
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {learningContent.introduction.objectives.map(
                          (objective, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">
                                {objective}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        実用的な活用場面
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {learningContent.introduction.realWorldApplication.map(
                          (application, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2"
                            >
                              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                              <span className="text-sm">
                                {application}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Target className="w-4 h-4" />
                  <AlertDescription>
                    <strong>学習の位置づけ：</strong>{" "}
                    {
                      learningContent.introduction
                        .skillProgression
                    }
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <Button
                    onClick={handlePhaseComplete}
                    size="lg"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    学習を開始する
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* インプットフェーズ */}
        {currentPhase === "input" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                学習コンテンツ - 自分に合った形式を選択
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="slides"
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    スライド形式
                  </TabsTrigger>
                  <TabsTrigger
                    value="text"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    テキスト形式
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="slides" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {
                            learningContent.slides[slideIndex]
                              .title
                          }
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSlideIndex(
                                Math.max(0, slideIndex - 1),
                              )
                            }
                            disabled={slideIndex === 0}
                          >
                            前へ
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {slideIndex + 1} /{" "}
                            {learningContent.slides.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSlideIndex(
                                Math.min(
                                  learningContent.slides
                                    .length - 1,
                                  slideIndex + 1,
                                ),
                              )
                            }
                            disabled={
                              slideIndex ===
                              learningContent.slides.length - 1
                            }
                          >
                            次へ
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⌨️ キーボード操作: ← → で移動 / Enter で次へ
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-6 bg-blue-50 rounded-lg">
                        <p className="text-lg mb-4">
                          {
                            learningContent.slides[slideIndex]
                              .content
                          }
                        </p>
                        <div className="p-4 bg-white rounded border-l-4 border-blue-500">
                          <h4 className="mb-2">💡 実用例</h4>
                          <p className="text-sm text-muted-foreground">
                            {
                              learningContent.slides[slideIndex]
                                .practicalExample
                            }
                          </p>
                        </div>
                      </div>

                      {slideIndex ===
                        learningContent.slides.length - 1 && (
                        <div className="text-center">
                          <Button onClick={handlePhaseComplete}>
                            学習完了 - 確認テストへ進む
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="text" className="mt-6">
                  <Card>
                    <CardContent className="space-y-6">
                      {learningContent.textContent.sections.map(
                        (section, index) => (
                          <div
                            key={index}
                            className="space-y-3"
                          >
                            <h3 className="text-lg">
                              {section.title}
                            </h3>
                            <p className="text-muted-foreground">
                              {section.content}
                            </p>
                          </div>
                        ),
                      )}

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-green-600" />
                          実践のコツ
                        </h4>
                        <div className="space-y-2">
                          {learningContent.textContent.practicalTips.map(
                            (tip, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{tip}</p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400">
                        <h4 className="mb-2">重要なポイント</h4>
                        <div className="space-y-1">
                          {learningContent.keyPoints.map(
                            (point, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <Target className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm">
                                  {point}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                        <h4 className="mb-2">💡 学習のコツ</h4>
                        <p className="text-sm">
                          HTMLタグは実際に書いて覚えるのが一番効果的です。次の確認テストと実践課題で手を動かしてみましょう！
                        </p>
                      </div>

                      <div className="mt-6 text-center">
                        <Button onClick={handlePhaseComplete}>
                          学習完了 - 確認テストへ進む
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* この単元を終えたら次のエリア */}
      {currentPhase === "input" && nextNodes.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          
        </div>
      )}
    </div>
  );
}