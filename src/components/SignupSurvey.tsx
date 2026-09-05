import { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { BookOpen, ArrowRight, AlertCircle } from 'lucide-react'
import { questionConfig as questionConfigData } from '../data/questionConfig'
import {
  validateDiagnosisAnswers,
  type DiagnosisAnswers,
} from '../../supabase/functions/_shared/diagnosis'
import { saveDiagnosis } from '../utils/auth'

type Level = 'beginner' | 'intermediate' | 'advanced' | ''
type QuestionId = string

interface QuestionOption {
  value: string
  label: string
  score: number
}

interface Question {
  weight: number
  id: QuestionId
  label: string
  placeholder: string
  options: QuestionOption[]
}

export interface SurveyData {
  levelScore: number
  level: Level
  programming_experience?: string
  rule_confidence?: string
  knowledge_concept?: string
  [key: string]: string | number
}

interface SignupSurveyProps {
  userName: string
  accessToken: string
  onComplete: (answers: DiagnosisAnswers) => void
}

const questionConfig: Question[] = questionConfigData

const conditionalQuestionIds = new Set([
  'skill_errors',
  'error_handling',
  'learning_anxiety'
])

export function SignupSurvey({ userName, accessToken, onComplete }: SignupSurveyProps) {
  const [formData, setFormData] = useState<SurveyData>({
    levelScore: 0,
    level: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const shouldShowSkillQuestions = formData.programming_experience === 'yes'

  const isQuestionVisible = (question: Question) => {
    if (!conditionalQuestionIds.has(question.id)) return true
    return shouldShowSkillQuestions
  }

  const calculateScore = () => {
    return questionConfig.reduce((total, question) => {
      if (!isQuestionVisible(question)) return total
      const selectedValue = String(formData[question.id] ?? '')
      const optionScore = (question.options.find(option => option.value === selectedValue)?.score ?? 0) * question.weight
      return total + optionScore
    }, 0)
  }

const determineLevel = (score: number): SurveyData['level'] => {
  if (score >= 24) return 'advanced'
  if (score >= 17) return 'intermediate'
  if (score >= 10) return 'beginner'
  return 'beginner'
}

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    
    const isFormComplete = questionConfig.every((question) => {
      if (!isQuestionVisible(question)) return true
      return Boolean(formData[question.id])
    })

    if (!isFormComplete) {
      setError('すべての必須項目に回答してください')
      return
    }

    const validation = validateDiagnosisAnswers({
      programming_experience: formData.programming_experience,
      rule_confidence: formData.rule_confidence,
      knowledge_concept: formData.knowledge_concept,
    })

    if (!validation.success) {
      setError('診断に必要な3項目へ回答してください')
      return
    }

    setIsLoading(true)

    try {
      const saved = await saveDiagnosis(validation.data, accessToken)
      onComplete(saved.answers)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '診断の保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const currentScore = calculateScore()
  const currentLevel = determineLevel(currentScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">ようこそ、{userName}さん！</CardTitle>
            <CardDescription className="text-base mt-2">
              あなたに最適な学習プランを作成するため、いくつか教えてください
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {questionConfig.filter(isQuestionVisible).map((question) => (
                <div className="space-y-2" key={question.id}>
                  <Label htmlFor={question.id}>{question.label}</Label>
                  <Select
                    value={String(formData[question.id] ?? '')}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, [question.id]: value }))}
                  >
                    <SelectTrigger id={question.id}>
                      <SelectValue placeholder={question.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {currentLevel && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <span className="font-semibold">推奨レベル: </span>
                    {currentLevel === 'beginner' && '初級（基礎から丁寧に学習）'}
                    {currentLevel === 'intermediate' && '中級（基本を復習しながら応用へ）'}
                    {currentLevel === 'advanced' && '上級（実践的なスキルを習得）'}
                  </p>
                </div>
              )}
              
              {error && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-3">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? '処理中...' : '学習を始める'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
