import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  FileText,
  Home,
  Play,
  Target,
} from 'lucide-react'

import {
  resolvePilotLearningMaterial,
} from '../features/material/pilotMaterials'
import type {
  LearningMaterialBlock,
  LearningMaterialSection,
} from '../features/material/types'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface LearningModuleProps {
  onComplete: () => void
  onDashboard: () => void
  currentNodeId: string
  currentNodeName: string
  completedNodeIds: string[]
}

type LearningPhase = 'introduction' | 'input'
type LearningFormat = 'slides' | 'text'

function isLearningFormat(value: string): value is LearningFormat {
  return value === 'slides' || value === 'text'
}

function MaterialBlock({ block }: { block: LearningMaterialBlock }) {
  if (block.kind === 'paragraph') {
    return <p className="leading-7 text-muted-foreground">{block.content}</p>
  }

  if (block.kind === 'code') {
    return (
      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-50">
        <code>{block.content}</code>
      </pre>
    )
  }

  if (block.kind === 'list') {
    const List = block.ordered ? 'ol' : 'ul'
    return (
      <List
        className={block.ordered
          ? 'list-decimal space-y-2 pl-6 text-muted-foreground'
          : 'list-disc space-y-2 pl-6 text-muted-foreground'}
      >
        {block.items.map(item => <li key={item}>{item}</li>)}
      </List>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {block.headers.map(header => (
              <th key={header} className="border bg-slate-50 px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join('-')}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cellIndex}-${cell}`} className="border px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MaterialSection({ section }: { section: LearningMaterialSection }) {
  return (
    <section className="space-y-4" data-material-section={section.sectionId}>
      <h3 className="text-lg font-medium">{section.title}</h3>
      {section.blocks.map((block, index) => (
        <MaterialBlock key={`${section.sectionId}-${index}`} block={block} />
      ))}
    </section>
  )
}

export function LearningModule({
  onComplete,
  onDashboard,
  currentNodeId,
  currentNodeName,
}: LearningModuleProps) {
  const material = resolvePilotLearningMaterial(currentNodeId)
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>('introduction')
  const [activeTab, setActiveTab] = useState<LearningFormat>('slides')
  const [slideIndex, setSlideIndex] = useState(0)

  const handlePhaseComplete = useCallback(() => {
    if (!material) return

    if (currentPhase === 'introduction') {
      setCurrentPhase('input')
      return
    }

    onComplete()
  }, [currentPhase, material, onComplete])

  useEffect(() => {
    if (!material || currentPhase !== 'input' || activeTab !== 'slides') return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLTextAreaElement
        || event.target instanceof HTMLInputElement
        || event.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (event.key === 'ArrowLeft') {
        setSlideIndex(current => Math.max(0, current - 1))
        event.preventDefault()
        return
      }

      if (event.key === 'ArrowRight') {
        setSlideIndex(current => Math.min(material.sections.length - 1, current + 1))
        event.preventDefault()
        return
      }

      if (event.key === 'Enter') {
        if (slideIndex === material.sections.length - 1) {
          handlePhaseComplete()
        } else {
          setSlideIndex(current => current + 1)
        }
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, currentPhase, handlePhaseComplete, material, slideIndex])

  if (!material) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
            <Button onClick={onDashboard} variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" />
              ダッシュボード
            </Button>
            <div>
              <h1 className="text-xl">{currentNodeName}</h1>
              <p className="text-sm text-muted-foreground">対象ノード: {currentNodeId}</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              このノードの教材は未対応です。別ノードの教材にはフォールバックしません。
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  const currentSection = material.sections[slideIndex]
  const phaseProgress = currentPhase === 'introduction' ? 40 : 100

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onDashboard} variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" />
              ダッシュボード
            </Button>
            <div>
              <h1 className="text-xl">{currentNodeName}</h1>
              <p className="text-sm text-muted-foreground">
                対象ノード: {material.nodeId} / {currentPhase === 'introduction'
                  ? '導入フェーズ'
                  : 'インプットフェーズ'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>学習進捗</span>
              <span>{phaseProgress}%</span>
            </div>
            <Progress value={phaseProgress} className="w-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {currentPhase === 'introduction' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {material.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Badge variant="outline">{material.reviewStatus}</Badge>
              <p className="leading-7 text-muted-foreground">{material.statusNote}</p>
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">
                参照元: {material.sourceDocumentPath} {material.sourceSection}
              </div>
              <div className="text-center">
                <Button onClick={handlePhaseComplete} size="lg">
                  <BookOpen className="mr-2 h-4 w-4" />
                  学習を開始する
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentPhase === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {material.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={value => {
                  if (isLearningFormat(value)) setActiveTab(value)
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="slides" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    スライド形式
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    テキスト形式
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="slides" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="text-lg">{currentSection.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSlideIndex(current => Math.max(0, current - 1))}
                            disabled={slideIndex === 0}
                          >
                            前へ
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {slideIndex + 1} / {material.sections.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSlideIndex(current => (
                              Math.min(material.sections.length - 1, current + 1)
                            ))}
                            disabled={slideIndex === material.sections.length - 1}
                          >
                            次へ
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        キーボード操作: ← → で移動 / Enter で次へ
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <MaterialSection section={currentSection} />
                      {slideIndex === material.sections.length - 1 && (
                        <div className="text-center">
                          <Button onClick={handlePhaseComplete}>
                            学習完了 - 確認テストへ進む
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="text" className="mt-6">
                  <Card>
                    <CardContent className="space-y-8 pt-6">
                      {material.sections.map(section => (
                        <MaterialSection key={section.sectionId} section={section} />
                      ))}
                      <div className="text-center">
                        <Button onClick={handlePhaseComplete}>
                          学習完了 - 確認テストへ進む
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
