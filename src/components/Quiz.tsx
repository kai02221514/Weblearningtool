import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Home } from 'lucide-react'

interface QuizProps {
  onComplete: (score: number) => void
  onDashboard: () => void
  onReturnToLearning: () => void
}

const quizQuestions = [
  {
    type: 'multiple',
    question: 'HTMLファイルの基本構造で、最初に書くべき宣言は何ですか？',
    options: [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<body>'
    ],
    correct: 0,
    explanation: '<!DOCTYPE html>は、文書がHTML5であることをブラウザに伝える宣言です。'
  },
  {
    type: 'fill',
    question: '見出しを表すHTMLタグは < >です。（数字なしで回答）',
    answer: 'h1',
    explanation: '<h1>から<h6>まで、6段階の見出しタグがあります。'
  },
  {
    type: 'multiple',
    question: 'HTMLタグで、段落を表すのはどれですか？',
    options: [
      '<div>',
      '<span>',
      '<p>',
      '<section>'
    ],
    correct: 2,
    explanation: '<p>タグは paragraph（段落）の略です。'
  }
]

export function Quiz({ onComplete, onDashboard, onReturnToLearning }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(number | string | null)[]>(new Array(quizQuestions.length).fill(null))
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)

  const handleAnswer = (answer: number | string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateScore()
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateScore = () => {
    let correctCount = 0
    quizQuestions.forEach((question, index) => {
      if (question.type === 'multiple') {
        if (answers[index] === question.correct) correctCount++
      } else if (question.type === 'fill') {
        if (answers[index]?.toString().toLowerCase() === question.answer.toLowerCase()) correctCount++
      }
    })
    setScore(correctCount)
    setShowResult(true)
  }

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100
  const question = quizQuestions[currentQuestion]

  if (showResult) {
    const percentage = Math.round((score / quizQuestions.length) * 100)
    const isPassed = percentage >= 70

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isPassed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isPassed ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {isPassed ? '合格おめでとうございます！' : 'もう少し復習が必要です'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{score} / {quizQuestions.length}</div>
                <div className="text-xl mb-4">正答率: {percentage}%</div>
                <Badge variant={isPassed ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                  {isPassed ? '合格（70%以上）' : '再挑戦が必要（70%未満）'}
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                {quizQuestions.map((q, index) => {
                  const isCorrect = q.type === 'multiple' 
                    ? answers[index] === q.correct
                    : answers[index]?.toString().toLowerCase() === q.answer.toLowerCase()
                  
                  return (
                    <Card key={index} className={isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="mb-2">問題{index + 1}: {q.question}</p>
                            <p className="text-sm text-muted-foreground">{q.explanation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={onDashboard}>
                  <Home className="w-4 h-4 mr-2" />
                  ダッシュボード
                </Button>
                
                {!isPassed && (
                  <Button variant="outline" onClick={onReturnToLearning}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    復習する
                  </Button>
                )}
                
                {isPassed && (
                  <Button onClick={() => onComplete(percentage)}>
                    実践課題へ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1>確認テスト: HTMLの基礎</h1>
            <Button variant="outline" size="sm" onClick={onDashboard}>
              <Home className="w-4 h-4 mr-2" />
              ダッシュボード
            </Button>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>問題 {currentQuestion + 1} / {quizQuestions.length}</span>
            <span>進捗: {Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>問題 {currentQuestion + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-lg">{question.question}</p>

              {question.type === 'multiple' && (
                <RadioGroup 
                  value={answers[currentQuestion]?.toString()} 
                  onValueChange={(value) => handleAnswer(parseInt(value))}
                >
                  {question.options.map((option, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-2 p-3 rounded border hover:bg-gray-50 cursor-pointer"
                      onClick={() => document.getElementById(`option-${index}`)?.click()}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === 'fill' && (
                <div className="space-y-2">
                  <Label>答えを入力してください:</Label>
                  <Input
                    placeholder="タグ名を入力（例: div）"
                    value={answers[currentQuestion]?.toString() || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="text-lg p-4"
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={prevQuestion} 
                  disabled={currentQuestion === 0}
                >
                  前の問題
                </Button>
                
                <Button 
                  onClick={nextQuestion}
                  disabled={answers[currentQuestion] === null || answers[currentQuestion] === ''}
                >
                  {currentQuestion === quizQuestions.length - 1 ? '結果を見る' : '次の問題'}
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