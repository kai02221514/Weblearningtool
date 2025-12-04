import { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { BookOpen, ArrowRight, AlertCircle } from 'lucide-react'
import { questionConfig as questionConfigData } from '../data/questionConfig'
import { saveProfile } from '../utils/auth'

type Level = 'beginner' | 'intermediate' | 'advanced' | ''
type QuestionKey = 'age' | 'occupation' | 'pace'

interface QuestionOption {
  value: string
  label: string
  score: number
}

interface Question {
  weight: number
  id: QuestionKey
  label: string
  placeholder: string
  options: QuestionOption[]
}

interface SurveyData {
  age: string
  occupation: string
  pace: string
  levelScore: number
  level: Level
}

interface SignupSurveyProps {
  userName: string
  userEmail: string
  userId: string
  onComplete: (surveyData: SurveyData) => void
}

const questionConfig: Question[] = questionConfigData.map((q) => ({
  ...q,
  id: q.id as QuestionKey
}))

export function SignupSurvey({ userName, userEmail, userId, onComplete }: SignupSurveyProps) {
  const [formData, setFormData] = useState<SurveyData>({
    age: '',
    occupation: '',
    pace: '',
    levelScore: 0,
    level: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const calculateScore = () => {
    return questionConfig.reduce((total, question) => {
      const selectedValue = formData[question.id]
      const optionScore = (question.options.find(option => option.value === selectedValue)?.score ?? 0) * question.weight
      return total + optionScore
    }, 0)
  }

  const determineLevel = (score: number): SurveyData['level'] => {
    if (score >= 7) return 'advanced'
    if (score >= 5) return 'intermediate'
    if (score > 0) return 'beginner'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    
    if (formData.age && formData.occupation && formData.pace) {
      setIsLoading(true)
      const totalScore = calculateScore()
      const level = determineLevel(totalScore)
      const submissionData = {
        ...formData,
        levelScore: totalScore,
        level
      }
      
      try {
        // Note: For signup flow, we don't have accessToken yet
        // The profile will be saved with a temporary token or after signin
        // For now, we'll just complete the survey and move to tutorial
        setFormData(submissionData)
        onComplete(submissionData)
      } catch (err: any) {
        setError(err.message || 'アンケートの保存に失敗しました')
        setIsLoading(false)
      }
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
              {questionConfig.map((question) => (
                <div className="space-y-2" key={question.id}>
                  <Label htmlFor={question.id}>{question.label}</Label>
                  <Select
                    value={formData[question.id]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, [question.id]: value }))}
                  >
                    <SelectTrigger>
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