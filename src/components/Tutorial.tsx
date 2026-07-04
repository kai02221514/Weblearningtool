import { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { ChevronRight, ChevronLeft, Play, BookOpen, PenTool, Code, Trophy } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface TutorialProps {
  onComplete: () => void
  userName: string
}

const tutorialSteps = [
  {
    title: `こんにちは！プログラミングの世界へようこそ`,
    description: 'このサービスでは、HTML/CSS/JavaScriptを段階的に学んでいきます。',
    icon: BookOpen,
    content: 'プログラミング初学者の方でも安心して学習できるよう、基礎から丁寧に説明します。実際に手を動かしながら学ぶことで、確実にスキルが身につきます。'
  },
  {
    title: '学習の流れ',
    description: '4つのステップで効率的に学習を進めます。',
    icon: Play,
    content: '①インプット学習→②確認テスト→③実践課題→④復習 というサイクルで学習します。理解できるまで何度でも繰り返し学べます。'
  },
  {
    title: '実践重視のカリキュラム',
    description: 'コードを書いて、実際に動くものを作りま���ょう。',
    icon: Code,
    content: 'テキストを読むだけでなく、実際にコードエディタでプログラムを書きます。書いたコードがすぐにプレビューで確認できるので、学習効果が高まります。'
  },
  {
    title: '達成感のある学習体験',
    description: '進捗が見えるから、継続しやすい。',
    icon: Trophy,
    content: '学習進捗がグラフで可視化され、単元をクリアするごとに成果を実感できます。最終的にはポートフォリオサイトを作成して修了証を取得できます。'
  }
]

export function Tutorial({ onComplete, userName }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }, [currentStep, onComplete])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // エンターキーでnextStepを実行
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter または スペースキーで次へ
      if (e.key === 'Enter' || e.key === ' ') {
        nextStep()
        e.preventDefault()
      }
      // 左矢印キーで前へ
      if (e.key === 'ArrowLeft' && currentStep > 0) {
        prevStep()
        e.preventDefault()
      }
      // 右矢印キーで次へ
      if (e.key === 'ArrowRight') {
        nextStep()
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentStep, nextStep, prevStep])

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100
  const currentTutorial = tutorialSteps[currentStep]
  const IconComponent = currentTutorial.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <Card className="shadow-xl flex flex-col" style={{ minHeight: '600px' }}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{currentTutorial.title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {currentTutorial.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1">
            <div className="flex-1">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>チュートリアル進行状況</span>
                  <span>{currentStep + 1} / {tutorialSteps.length}</span>
                </div>
                <Progress value={progress} className="mb-4" />
              </div>

              <div className="mb-6">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1753613648191-4771cf76f034?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbGVhcm5pbmclMjBlZHVjYXRpb24lMjBvbmxpbmV8ZW58MXx8fHwxNzU3MjQ3Mjc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Learning tutorial"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-primary mb-6">
                <p className="text-base leading-relaxed">
                  {currentTutorial.content}
                </p>
              </div>

              {currentStep === 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm">インプット</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <PenTool className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm">テスト</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Code className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm">実践</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm">復習</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-auto pt-4">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                前へ
              </Button>
              
              <Button onClick={nextStep}>
                {currentStep === tutorialSteps.length - 1 ? '学習開始' : '次へ'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
