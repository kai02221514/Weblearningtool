import { useState } from 'react'
import { Auth } from './components/Auth'
import { SignupSurvey } from './components/SignupSurvey'
import { Tutorial } from './components/Tutorial'
import { LearningModule } from './components/LearningModule'
import { Quiz } from './components/Quiz'
import { PracticeChallenge } from './components/PracticeChallenge'
import { Dashboard } from './components/Dashboard'
import { Completion } from './components/Completion'
import { LearningReflections } from './components/LearningReflections'
import { LearningReflectionForm } from './components/LearningReflectionForm'

type Phase = 'auth' | 'survey' | 'tutorial' | 'dashboard' | 'learning' | 'quiz' | 'practice' | 'reflection' | 'completion' | 'reflections'

interface UserData {
  name: string
  email: string
  userId: string
  accessToken?: string
  age?: string
  occupation?: string
  pace?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  levelScore?: number
}

interface ErrorHistoryItem {
  errorId: string
  count: number
  lastOccurred: string
}

interface ReflectionData {
  moduleId: string
  moduleName: string
  date: string
  struggledConcepts: string[]
  reflection: string
  quickTestResult: boolean
  recommendations: string[]
}

interface Progress {
  completedModules: string[]
  totalModules: number
  currentStreak: number
  totalHours: number
  quizScores: number[]
  currentModule: string
  reflections: ReflectionData[]
  // 新しく追加するフィールド
  recommendedStartNodeIds: string[]
  inProgressNodeId: string | null
  errorHistory: ErrorHistoryItem[]
  detectedErrors: string[] // 最後の実践課題で検出されたエラーID
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('auth')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [progress, setProgress] = useState<Progress>({
    completedModules: ['html-basics'],
    totalModules: 5,
    currentStreak: 3,
    totalHours: 8,
    quizScores: [85, 92, 78],
    currentModule: 'HTMLの基礎',
    reflections: [],
    recommendedStartNodeIds: ['css-basics', 'html-semantics'],
    inProgressNodeId: null,
    errorHistory: [],
    detectedErrors: []
  })

  const handleSignupSuccess = (email: string, name: string, userId: string) => {
    setUserData({ email, name, userId })
    setPhase('survey')
  }

  const handleSigninSuccess = (email: string, name: string, accessToken: string, userId: string) => {
    setUserData({ email, name, userId, accessToken })
    setPhase('dashboard')
  }

  const handleSurveyComplete = (surveyData: any) => {
    if (userData) {
      setUserData({
        ...userData,
        age: surveyData.age,
        occupation: surveyData.occupation,
        pace: surveyData.pace,
        level: surveyData.level,
        levelScore: surveyData.levelScore
      })
    }
    setPhase('tutorial')
  }

  const handleTutorialComplete = () => {
    setPhase('dashboard')
  }

  const handleStartLearning = (moduleId: string) => {
    // モジュールIDに基づいて現在のモジュールを設定
    const moduleNames: { [key: string]: string } = {
      'html-basics': 'HTMLの基礎',
      'css-basics': 'CSSの基礎',
      'css-layout': 'CSSレイアウト',
      'javascript-intro': 'JavaScript入門',
      'responsive-design': 'レスポンシブデザイン'
    }
    
    setProgress(prev => ({
      ...prev,
      currentModule: moduleNames[moduleId] || 'HTMLの基礎'
    }))
    setPhase('learning')
  }

  const handleLearningComplete = () => {
    setPhase('quiz')
  }

  const handleQuizComplete = (score: number) => {
    setProgress(prev => ({
      ...prev,
      quizScores: [...prev.quizScores, score]
    }))
    setPhase('practice')
  }

  const handlePracticeComplete = () => {
    // 実践課題完了時に統計を更新
    setProgress(prev => ({
      ...prev,
      completedModules: [...prev.completedModules, 'current-module'],
      totalHours: prev.totalHours + 2,
      currentStreak: prev.currentStreak + 1
    }))
    setPhase('reflection')
  }

  const handleReflectionComplete = (reflectionData: ReflectionData) => {
    setProgress(prev => ({
      ...prev,
      reflections: [...prev.reflections, reflectionData]
    }))
    setPhase('dashboard')
  }

  const handleViewCompletion = () => {
    setPhase('completion')
  }

  const handleDashboard = () => {
    setPhase('dashboard')
  }

  const handleReturnToLearning = () => {
    setPhase('learning')
  }

  const handleViewReflections = () => {
    setPhase('reflections')
  }

  // レンダリング
  switch (phase) {
    case 'auth':
      return <Auth onSignupSuccess={handleSignupSuccess} onSigninSuccess={handleSigninSuccess} />
      
    case 'survey':
      return (
        <SignupSurvey 
          onComplete={handleSurveyComplete}
          userName={userData?.name || 'ユーザー'}
          userEmail={userData?.email || ''}
          userId={userData?.userId || ''}
        />
      )
      
    case 'tutorial':
      return (
        <Tutorial 
          onComplete={handleTutorialComplete}
          userName={userData?.name || 'ユーザー'}
        />
      )
      
    case 'dashboard':
      return (
        <Dashboard
          onStartLearning={handleStartLearning}
          onViewCompletion={handleViewCompletion}
          onViewReflections={handleViewReflections}
          userData={userData}
          progress={progress}
        />
      )
      
    case 'learning':
      return (
        <LearningModule
          onComplete={handleLearningComplete}
          onDashboard={handleDashboard}
          currentModule={progress.currentModule}
        />
      )
      
    case 'quiz':
      return (
        <Quiz
          onComplete={handleQuizComplete}
          onDashboard={handleDashboard}
          onReturnToLearning={handleReturnToLearning}
        />
      )
      
    case 'practice':
      return (
        <PracticeChallenge
          onComplete={handlePracticeComplete}
          onDashboard={handleDashboard}
          onStartLearning={handleStartLearning}
        />
      )
      
    case 'completion':
      return (
        <Completion
          onDashboard={handleDashboard}
          userData={userData}
          progress={progress}
        />
      )
      
    case 'reflection':
      return (
        <LearningReflectionForm
          onComplete={handleReflectionComplete}
          onDashboard={handleDashboard}
          currentModule={progress.currentModule}
        />
      )
      
    case 'reflections':
      return (
        <LearningReflections
          onDashboard={handleDashboard}
          reflections={progress.reflections}
        />
      )
      
    default:
      return <div>エラー: 不明なフェーズです</div>
  }
}