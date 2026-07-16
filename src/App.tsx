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
import { getMvpLearningNodes, MVP_NODE_IDS } from './domain/mvpScope'

const learningNodes = getMvpLearningNodes()

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
  nodeId: string
  nodeName: string
  date: string
  struggledConcepts: string[]
  reflection: string
  quickTestResult: boolean
  recommendations: string[]
}

interface Progress {
  completedNodeIds: string[]
  totalNodes: number
  currentStreak: number
  totalHours: number
  quizScores: number[]
  currentNodeId: string
  currentNodeName: string
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
    completedNodeIds: ['html-000'],
    totalNodes: MVP_NODE_IDS.length,
    currentStreak: 3,
    totalHours: 8,
    quizScores: [85, 92, 78],
    currentNodeId: 'html-010',
    currentNodeName: 'HTML基本骨格(doctype / html / head / body)',
    reflections: [],
    recommendedStartNodeIds: ['html-010'],
    inProgressNodeId: 'html-010',
    errorHistory: [],
    detectedErrors: []
  })

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

  const handleStartLearning = (nodeId: string) => {
    const node = learningNodes.find(item => item.id === nodeId)
    if (!node) return

    setProgress(prev => ({
      ...prev,
      currentNodeId: node.id,
      currentNodeName: node.title,
      inProgressNodeId: node.id,
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
    setProgress(prev => ({
      ...prev,
      completedNodeIds: prev.completedNodeIds.includes(prev.currentNodeId)
        ? prev.completedNodeIds
        : [...prev.completedNodeIds, prev.currentNodeId],
      inProgressNodeId: null,
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
      return <Auth onSigninSuccess={handleSigninSuccess} />
      
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
          key={progress.currentNodeId}
          onComplete={handleLearningComplete}
          onDashboard={handleDashboard}
          currentNodeId={progress.currentNodeId}
          currentNodeName={progress.currentNodeName}
          completedNodeIds={progress.completedNodeIds}
        />
      )
      
    case 'quiz':
      return (
        <Quiz
          nodeId={progress.currentNodeId}
          nodeName={progress.currentNodeName}
          onComplete={handleQuizComplete}
          onDashboard={handleDashboard}
          onReturnToLearning={handleReturnToLearning}
        />
      )
      
    case 'practice':
      return (
        <PracticeChallenge
          nodeId={progress.currentNodeId}
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
          currentNodeId={progress.currentNodeId}
          currentNodeName={progress.currentNodeName}
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
