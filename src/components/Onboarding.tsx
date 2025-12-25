import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { User, BookOpen } from 'lucide-react'
import { questionConfig as questionConfigData } from '../data/questionConfig'

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

interface FormData {
  name: string
  age: string
  occupation: string
  pace: string
  levelScore: number
  level: Level
}

interface OnboardingProps {
  onComplete: (userData: FormData) => void
}

const questionConfig: Question[] = questionConfigData.map((q) => ({
  ...q,
  id: q.id as QuestionKey
}))

export function Onboarding({ onComplete }: OnboardingProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    occupation: '',
    pace: '',
    levelScore: 0,
    level: ''
  })

  const calculateScore = () => {
    return questionConfig.reduce((total, question) => {
      const selectedValue = formData[question.id]
      const optionScore = (question.options.find(option => option.value === selectedValue)?.score ?? 0) * question.weight
      return total + optionScore
    }, 0)
  }

  const determineLevel = (score: number): FormData['level'] => {
    if (score >= 7) return 'advanced'
    if (score >= 5) return 'intermediate'
    if (score > 0) return 'beginner'
    return ''
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (formData.name && formData.age && formData.occupation && formData.pace) {
      const totalScore = calculateScore()
      const level = determineLevel(totalScore)
      const submissionData = {
        ...formData,
        levelScore: totalScore,
        level
      }
      setFormData(submissionData)
      onComplete(submissionData)
    }
  }

  const currentScore = calculateScore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">プログラミング学習へようこそ！</CardTitle>
            <CardDescription className="text-lg mt-2">
              あなたに最適な学習プランを作成するため、いくつか教えてください
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">お名前</Label>
                <Input
                  id="name"
                  placeholder="山田太郎"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

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
                <p>合計スコア: {currentScore}</p>
              <Button type="submit" className="w-full" size="lg">
                <BookOpen className="w-4 h-4 mr-2" />
                学習を始める
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}