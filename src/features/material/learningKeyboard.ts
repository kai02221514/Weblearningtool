export type LearningShortcutAction = 'previous' | 'next' | 'complete'

interface LearningShortcutInput {
  key: string
  slideIndex: number
  sectionCount: number
  isInteractiveTarget: boolean
}

const interactiveTargetSelector = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[role="tab"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ')

export function isInteractiveLearningShortcutTarget(target: EventTarget | null): boolean {
  const closest = (target as { closest?: (selector: string) => Element | null } | null)?.closest
  return typeof closest === 'function'
    && closest.call(target, interactiveTargetSelector) !== null
}

export function getLearningShortcutAction({
  key,
  slideIndex,
  sectionCount,
  isInteractiveTarget,
}: LearningShortcutInput): LearningShortcutAction | null {
  if (isInteractiveTarget) return null

  if (key === 'ArrowLeft') return 'previous'
  if (key === 'ArrowRight') return 'next'
  if (key !== 'Enter') return null

  return slideIndex >= sectionCount - 1 ? 'complete' : 'next'
}
