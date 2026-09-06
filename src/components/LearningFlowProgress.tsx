import { CheckCircle } from 'lucide-react'

const steps = [
  { id: 'learning', label: '教材' },
  { id: 'quiz', label: '確認テスト' },
  { id: 'practice', label: '実践課題' },
  { id: 'reflection', label: '振り返り' },
] as const

export type LearningFlowStep = typeof steps[number]['id']

export function LearningFlowProgress({ currentStep }: { currentStep: LearningFlowStep }) {
  const currentIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <nav aria-label="単元の学習段階" className="rounded-lg border bg-white p-3">
      <ol className="learning-flow-steps grid grid-cols-2 gap-2">
        {steps.map((step, index) => {
          const completed = index < currentIndex
          const current = index === currentIndex

          return (
            <li
              key={step.id}
              aria-current={current ? 'step' : undefined}
              className={`flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm ${
                current
                  ? 'bg-blue-600 font-medium text-white'
                  : completed
                    ? 'bg-green-50 text-green-800'
                    : 'bg-gray-50 text-muted-foreground'
              }`}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs">
                {completed ? <CheckCircle className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className="truncate">{step.label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
