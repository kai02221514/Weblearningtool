import { describe, expect, it } from 'vitest'

import {
  getLearningShortcutAction,
  isInteractiveLearningShortcutTarget,
} from './learningKeyboard'

describe('learning material keyboard shortcuts', () => {
  it('detects interactive ancestors through the event target closest lookup', () => {
    let receivedSelector = ''
    const nestedControlTarget = {
      closest: (selector: string) => {
        receivedSelector = selector
        return {} as Element
      },
    } as unknown as EventTarget

    expect(isInteractiveLearningShortcutTarget(nestedControlTarget)).toBe(true)
    expect(receivedSelector).toContain('button')
    expect(receivedSelector).toContain('a')
    expect(receivedSelector).toContain('[role="tab"]')
    expect(receivedSelector).toContain('[contenteditable]')
  })

  it('does not treat targets without an interactive ancestor as controls', () => {
    const nonInteractiveTarget = { closest: () => null } as unknown as EventTarget

    expect(isInteractiveLearningShortcutTarget(nonInteractiveTarget)).toBe(false)
    expect(isInteractiveLearningShortcutTarget(null)).toBe(false)
  })

  it('leaves keyboard handling to interactive controls', () => {
    expect(getLearningShortcutAction({
      key: 'Enter',
      slideIndex: 5,
      sectionCount: 6,
      isInteractiveTarget: true,
    })).toBeNull()

    expect(getLearningShortcutAction({
      key: 'ArrowLeft',
      slideIndex: 5,
      sectionCount: 6,
      isInteractiveTarget: true,
    })).toBeNull()
  })

  it('moves between slides from non-interactive targets', () => {
    expect(getLearningShortcutAction({
      key: 'ArrowLeft',
      slideIndex: 2,
      sectionCount: 6,
      isInteractiveTarget: false,
    })).toBe('previous')

    expect(getLearningShortcutAction({
      key: 'ArrowRight',
      slideIndex: 2,
      sectionCount: 6,
      isInteractiveTarget: false,
    })).toBe('next')

    expect(getLearningShortcutAction({
      key: 'Enter',
      slideIndex: 2,
      sectionCount: 6,
      isInteractiveTarget: false,
    })).toBe('next')
  })

  it('completes only when Enter is pressed on the last slide', () => {
    expect(getLearningShortcutAction({
      key: 'Enter',
      slideIndex: 5,
      sectionCount: 6,
      isInteractiveTarget: false,
    })).toBe('complete')

    expect(getLearningShortcutAction({
      key: 'Escape',
      slideIndex: 5,
      sectionCount: 6,
      isInteractiveTarget: false,
    })).toBeNull()
  })
})
