import { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { BookOpen, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { questionConfig as questionConfigData } from '../data/questionConfig'
import {
  validateDiagnosisAnswers,
  type DiagnosisAnswers,
} from '../../supabase/functions/_shared/diagnosis'
import { saveDiagnosis } from '../utils/auth'

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
  programming_experience?: string
  rule_confidence?: string
  knowledge_concept?: string
  [key: string]: string | undefined
}

interface SignupSurveyProps {
  userName: string
  accessToken: string
  onComplete: (answers: DiagnosisAnswers) => void
}

const diagnosisQuestionIds = new Set([
  'programming_experience',
  'rule_confidence',
  'knowledge_concept',
])

const questionConfig: Question[] = questionConfigData.filter(question => (
  diagnosisQuestionIds.has(question.id)
))

export function SignupSurvey({ userName, accessToken, onComplete }: SignupSurveyProps) {
  const [formData, setFormData] = useState<SurveyData>({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    
    const isFormComplete = questionConfig.every((question) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">初回診断（必須）</CardTitle>
            <CardDescription className="text-base mt-2">
              {userName}さんの回答を保存し、学習の開始位置と次に学ぶ単元を決めます。
              保存が完了するまでDashboardには進みません。
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  保存するのは、開始判定に必要な以下の3項目だけです。
                </AlertDescription>
              </Alert>

              {questionConfig.map((question) => (
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
              
              {error && (
                <Alert className="mt-4" variant="destructive" role="alert" aria-live="assertive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-3">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? '診断を保存しています...' : '診断を保存して推薦を見る'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
