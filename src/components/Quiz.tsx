import { useEffect, useMemo, useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Home, AlertTriangle } from 'lucide-react'
import {
  QuizAttemptInputError,
  addQuizAttempt,
  getQuizAttemptState,
  type QuizAttemptResult,
} from '../features/quiz/attempts'
import {
  QuizGradingInputError,
  type QuizQuestionGradingResult,
} from '../features/quiz/grading'
import { PILOT_QUIZ_NODE_IDS } from '../features/quiz/quizCatalog'
import {
  createEmptyQuizAnswerState,
  buildQuizSubmission,
  getQuizQuestionAnswer,
  gradeQuizUiAnswerState,
  isQuizQuestionAnswered,
  isQuizReadyToSubmit,
  resolvePilotQuizByNodeId,
  setQuizQuestionAnswer,
  type QuizUiAnswerState,
} from '../features/quiz/quizUiModel'
import type { QuizId, QuizQuestion } from '../features/quiz/types'

interface QuizProps {
  nodeId: string
  nodeName: string
  onComplete: (score: number) => void
  onDashboard: () => void
  onReturnToLearning: () => void
}

export function Quiz({
  nodeId,
  nodeName,
  onComplete,
  onDashboard,
  onReturnToLearning,
}: QuizProps) {
  const quiz = resolvePilotQuizByNodeId(nodeId)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<QuizUiAnswerState>(() =>
    quiz === null ? {} : createEmptyQuizAnswerState(quiz)
  )
  const [attemptHistory, setAttemptHistory] = useState<readonly QuizAttemptResult[]>([])
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttemptResult | null>(null)
  const [attemptStartedAt, setAttemptStartedAt] = useState(() => new Date().toISOString())
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentQuestion(0)
    setAnswers(quiz === null ? {} : createEmptyQuizAnswerState(quiz))
    setAttemptHistory([])
    setCurrentAttempt(null)
    setAttemptStartedAt(new Date().toISOString())
    setSubmitError(null)
  }, [quiz])

  const attemptState = useMemo(() => {
    return quiz === null ? null : getQuizAttemptState(attemptHistory, quiz)
  }, [attemptHistory, quiz])

  const resultByQuestionId = useMemo(() => {
    return new Map(
      currentAttempt?.questionResults.map(result => [result.questionId, result]) ?? []
    )
  }, [currentAttempt])

  const handleAnswer = useCallback((answer: string) => {
    if (quiz === null) return

    const question = quiz.questions[currentQuestion]
    setAnswers(prevAnswers => setQuizQuestionAnswer(prevAnswers, question, answer))
  }, [currentQuestion, quiz])

  const submitQuiz = useCallback(() => {
    if (
      quiz === null
      || !isQuizReadyToSubmit(quiz, answers)
      || attemptState === null
      || !attemptState.canAttempt
    ) return

    try {
      const submission = buildQuizSubmission(quiz, answers)
      const gradingResult = gradeQuizUiAnswerState(quiz, answers)
      const addedAttempt = addQuizAttempt({
        attempts: attemptHistory,
        submission,
        gradingResult,
        attemptId: createQuizAttemptId(quiz.quizId, attemptState.nextAttemptNumber),
        startedAt: attemptStartedAt,
        submittedAt: new Date().toISOString(),
      })
      setAttemptHistory(addedAttempt.attempts)
      setCurrentAttempt(addedAttempt.attempt)
      setSubmitError(null)
    } catch (error) {
      const detail = error instanceof QuizGradingInputError || error instanceof QuizAttemptInputError
        ? `${error.code}: ${JSON.stringify(error.details)}`
        : String(error)

      console.error('Quiz grading failed', detail)
      setSubmitError('確認テストの採点中に問題が発生しました。回答内容を確認してもう一度送信してください。')
    }
  }, [answers, attemptHistory, attemptStartedAt, attemptState, quiz])

  const retryQuiz = useCallback(() => {
    if (quiz === null || attemptState === null || !attemptState.canAttempt) return

    setCurrentQuestion(0)
    setAnswers(createEmptyQuizAnswerState(quiz))
    setCurrentAttempt(null)
    setAttemptStartedAt(new Date().toISOString())
    setSubmitError(null)
  }, [attemptState, quiz])

  const nextQuestion = useCallback(() => {
    if (quiz === null) return

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      submitQuiz()
    }
  }, [currentQuestion, quiz, submitQuiz])

  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }, [currentQuestion])

  useEffect(() => {
    if (quiz === null || currentAttempt !== null) return

    const question = quiz.questions[currentQuestion]

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isTextInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement

      if (question.type === 'single-choice' && !isTextInput) {
        const num = parseInt(event.key)
        if (num >= 1 && num <= question.choices.length) {
          handleAnswer(question.choices[num - 1].id)
          event.preventDefault()
          return
        }

        const currentAnswer = getQuizQuestionAnswer(answers, question)
        const currentChoiceId = currentAnswer?.type === 'single-choice'
          ? currentAnswer.choiceId
          : null
        const currentChoiceIndex = currentChoiceId === null
          ? -1
          : question.choices.findIndex(choice => choice.id === currentChoiceId)

        if (event.key === 'ArrowUp') {
          const previousIndex = currentChoiceIndex > 0
            ? currentChoiceIndex - 1
            : question.choices.length - 1
          handleAnswer(question.choices[previousIndex].id)
          event.preventDefault()
          return
        }

        if (event.key === 'ArrowDown') {
          const nextIndex = currentChoiceIndex >= 0 && currentChoiceIndex < question.choices.length - 1
            ? currentChoiceIndex + 1
            : 0
          handleAnswer(question.choices[nextIndex].id)
          event.preventDefault()
          return
        }
      }

      if (event.key === 'Enter' && (question.type !== 'code-completion' || isTextInput)) {
        if (isQuizQuestionAnswered(answers, question)) {
          nextQuestion()
          event.preventDefault()
        }
        return
      }

      if (!isTextInput && event.key === 'ArrowLeft') {
        prevQuestion()
        event.preventDefault()
        return
      }

      if (!isTextInput && event.key === 'ArrowRight') {
        if (isQuizQuestionAnswered(answers, question) && currentQuestion < quiz.questions.length - 1) {
          nextQuestion()
          event.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answers, currentAttempt, currentQuestion, handleAnswer, nextQuestion, prevQuestion, quiz])

  if (quiz === null) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-lg border-amber-200">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-amber-100">
                <AlertTriangle className="w-10 h-10 text-amber-700" />
              </div>
              <CardTitle className="text-2xl">このノードの確認テストは未対応です</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center text-muted-foreground">
                <p>対象ノード: {nodeId}</p>
                <p>現在接続済みの確認テスト: {PILOT_QUIZ_NODE_IDS.join(', ')}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={onDashboard}>
                  <Home className="w-4 h-4 mr-2" />
                  ダッシュボード
                </Button>
                <Button variant="outline" onClick={onReturnToLearning}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  学習に戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentAttempt !== null) {
    const percentage = Math.round((currentAttempt.score / currentAttempt.maxScore) * 100)

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                currentAttempt.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {currentAttempt.passed ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {currentAttempt.passed ? '合格おめでとうございます！' : 'もう少し復習が必要です'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">
                  {currentAttempt.score} / {currentAttempt.maxScore}
                </div>
                <div className="text-xl mb-4">正答率: {percentage}%</div>
                <Badge variant={currentAttempt.passed ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                  {currentAttempt.passed
                    ? `合格（${currentAttempt.passScore}/${currentAttempt.maxScore}以上）`
                    : `再挑戦が必要（${currentAttempt.passScore}/${currentAttempt.maxScore}未満）`}
                </Badge>
                <p className="text-sm text-muted-foreground mt-3">
                  {currentAttempt.quizId} / {currentAttempt.questionSetVersion} / 試行{currentAttempt.attemptNumber}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {quiz.questions.map((question, index) => {
                  const questionResult = resultByQuestionId.get(question.questionId)
                  if (questionResult === undefined) return null

                  return (
                    <Card
                      key={question.questionId}
                      className={questionResult.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {questionResult.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1 space-y-2">
                            <p className="mb-2">問題{index + 1}: {question.prompt}</p>
                            <p className="text-sm">
                              あなたの回答: {formatSubmittedAnswer(question, questionResult)}
                            </p>
                            <p className="text-sm">正答: {question.correctAnswer}</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
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

                {!currentAttempt.passed && (
                  <Button variant="outline" onClick={onReturnToLearning}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    復習する
                  </Button>
                )}

                {!currentAttempt.passed && attemptState?.canAttempt && (
                  <Button onClick={retryQuiz}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    再受験する
                  </Button>
                )}

                {currentAttempt.passed && (
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

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const question = quiz.questions[currentQuestion]
  const currentAnswer = getQuizQuestionAnswer(answers, question)
  const isCurrentQuestionAnswered = isQuizQuestionAnswered(answers, question)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1>確認テスト: {nodeName}</h1>
              <p className="text-sm text-muted-foreground">
                {quiz.quizId} / {quiz.questionSetVersion}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onDashboard}>
              <Home className="w-4 h-4 mr-2" />
              ダッシュボード
            </Button>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>問題 {currentQuestion + 1} / {quiz.questions.length}</span>
            <span>試行 {attemptState?.nextAttemptNumber ?? 1} / 進捗: {Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>問題 {currentQuestion + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-lg whitespace-pre-wrap">{question.prompt}</div>

              {question.type === 'single-choice' && (
                <RadioGroup
                  value={currentAnswer?.type === 'single-choice' ? currentAnswer.choiceId : ''}
                  onValueChange={(value) => handleAnswer(value)}
                >
                  {question.choices.map((choice, index) => {
                    const optionId = `${question.questionId}-${choice.id}`

                    return (
                      <div
                        key={choice.id}
                        className="flex items-center space-x-2 p-3 rounded border hover:bg-gray-50 cursor-pointer"
                        onClick={() => document.getElementById(optionId)?.click()}
                      >
                        <RadioGroupItem value={choice.id} id={optionId} />
                        <Label htmlFor={optionId} className="flex-1 cursor-pointer">
                          <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                          {choice.presentation === 'code' ? (
                            <pre className="inline-block align-top whitespace-pre-wrap font-mono text-sm">
                              {choice.label}
                            </pre>
                          ) : (
                            choice.label
                          )}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              )}

              {question.type === 'code-completion' && (
                <div className="space-y-2">
                  <Label>答えを入力してください:</Label>
                  <Input
                    placeholder="回答を入力"
                    value={currentAnswer?.type === 'code-completion' ? currentAnswer.answer : ''}
                    onChange={(event) => handleAnswer(event.target.value)}
                    className="text-lg p-4"
                  />
                </div>
              )}

              {submitError !== null && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
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
                  disabled={!isCurrentQuestionAnswered}
                >
                  {currentQuestion === quiz.questions.length - 1 ? '結果を見る' : '次の問題'}
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

function formatSubmittedAnswer(
  question: QuizQuestion,
  result: QuizQuestionGradingResult,
): string {
  if (question.type === 'single-choice' && result.questionType === 'single-choice') {
    const submittedChoice = question.choices.find(choice => choice.id === result.submittedChoiceId)
    return submittedChoice?.label ?? '未回答'
  }

  if (question.type === 'code-completion' && result.questionType === 'code-completion') {
    return result.submittedAnswer ?? '未回答'
  }

  return '未回答'
}

function createQuizAttemptId(quizId: QuizId, attemptNumber: number): string {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${quizId}-attempt-${attemptNumber}-${randomId}`
}
