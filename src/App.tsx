import { useState } from 'react'
import { Auth } from './components/Auth'
import { SignupSurvey, type SurveyData } from './components/SignupSurvey'
import { Tutorial } from './components/Tutorial'
import { LearningModule } from './components/LearningModule'
import { Quiz } from './components/Quiz'
import { PracticeChallenge } from './components/PracticeChallenge'
import { Dashboard } from './components/Dashboard'
import { Completion } from './components/Completion'
import { LearningReflections } from './components/LearningReflections'
import { LearningReflectionForm } from './components/LearningReflectionForm'
import { getMvpLearningNodes, MVP_NODE_IDS } from './domain/mvpScope'
import type { QuizAttemptResult } from './features/quiz/attempts'
import {
  applyDiagnosis,
  completeRouteNode,
  createInitialRouteRuntimeState,
  pickRouteDiagnosisAnswers,
  recordQuizAttempt,
  startRouteNode,
} from './features/route/routeRuntime'

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
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('auth')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [routeState, setRouteState] = useState(createInitialRouteRuntimeState)
  const [quizAttemptHistory, setQuizAttemptHistory] = useState<readonly QuizAttemptResult[]>([])
  const [progress, setProgress] = useState<Progress>({
    completedNodeIds: [],
    totalNodes: MVP_NODE_IDS.length,
    currentStreak: 0,
    totalHours: 0,
    quizScores: [],
    currentNodeId: 'html-000',
    currentNodeName: 'HTML入門（タグと要素）',
    reflections: [],
  })

  const handleSigninSuccess = (email: string, name: string, accessToken: string, userId: string) => {
    setUserData({ email, name, userId, accessToken })
    setPhase('dashboard')
  }

  const handleSurveyComplete = (surveyData: SurveyData) => {
    setRouteState(prev => applyDiagnosis(prev, pickRouteDiagnosisAnswers(surveyData)))
    if (userData) {
      setUserData({
        ...userData,
        age: surveyData.age === undefined ? undefined : String(surveyData.age),
        occupation: surveyData.occupation === undefined ? undefined : String(surveyData.occupation),
        pace: surveyData.pace === undefined ? undefined : String(surveyData.pace),
        level: surveyData.level || undefined,
        levelScore: surveyData.levelScore
      })
    }
    setPhase('dashboard')
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
    }))
    setRouteState(prev => startRouteNode(prev, node.id))
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

  const handleQuizAttemptFinalized = (attempt: QuizAttemptResult) => {
    setQuizAttemptHistory(prev => prev.some(item => item.attemptId === attempt.attemptId)
      ? prev
      : [...prev, attempt])
    setRouteState(prev => recordQuizAttempt(prev, attempt))
  }

  const handlePracticeComplete = () => {
    setProgress(prev => ({
      ...prev,
      completedNodeIds: prev.completedNodeIds.includes(prev.currentNodeId)
        ? prev.completedNodeIds
        : [...prev.completedNodeIds, prev.currentNodeId],
      totalHours: prev.totalHours + 2,
      currentStreak: prev.currentStreak + 1
    }))
    setRouteState(prev => completeRouteNode(prev, progress.currentNodeId))
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

  const handleTakeSurvey = () => {
    setPhase('survey')
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
          onTakeSurvey={handleTakeSurvey}
          userData={userData}
          progress={{
            ...progress,
            completedNodeIds: routeState.progress.completedNodeIds,
            assumedNodeIds: routeState.progress.assumedNodeIds,
            inProgressNodeId: routeState.progress.inProgressNodeId,
          }}
          routeResult={routeState.result}
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
        />
      )
      
    case 'quiz':
      return (
        <Quiz
          nodeId={progress.currentNodeId}
          nodeName={progress.currentNodeName}
          onComplete={handleQuizComplete}
          onAttemptFinalized={handleQuizAttemptFinalized}
          attemptHistory={quizAttemptHistory}
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
