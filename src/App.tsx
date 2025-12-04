import { useState } from 'react'
import { Onboarding } from './components/Onboarding'
import { Tutorial } from './components/Tutorial'
import { LearningModule } from './components/LearningModule'
import { Quiz } from './components/Quiz'
import { PracticeChallenge } from './components/PracticeChallenge'
import { Dashboard } from './components/Dashboard'
import { Completion } from './components/Completion'
import { LearningReflections } from './components/LearningReflections'
import { LearningReflectionForm } from './components/LearningReflectionForm'

type Phase = 'onboarding' | 'tutorial' | 'dashboard' | 'learning' | 'quiz' | 'practice' | 'reflection' | 'completion' | 'reflections'

interface UserData {
  name: string
  age: string
  occupation: string
  pace: string
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
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('onboarding')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [progress, setProgress] = useState<Progress>({
    completedModules: ['html-basics'],
    totalModules: 5,
    currentStreak: 3,
    totalHours: 8,
    quizScores: [85, 92, 78],
    currentModule: 'HTMLの基礎',
    reflections: []
  })

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data)
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
    case 'onboarding':
      return <Onboarding onComplete={handleOnboardingComplete} />
      
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