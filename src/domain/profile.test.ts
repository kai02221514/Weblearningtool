import { describe, expect, it } from 'vitest'
import {
  DISPLAY_NAME_MAX_LENGTH,
  validateDisplayName,
  validateDisplayNameRequest,
  validateStoredProfile,
} from '../../supabase/functions/_shared/profile'

describe('display name contract', () => {
  it.each([
    ['one character', 'あ', 'あ'],
    ['fifty characters', '界'.repeat(DISPLAY_NAME_MAX_LENGTH), '界'.repeat(DISPLAY_NAME_MAX_LENGTH)],
    ['trimmed Japanese', '  合成 利用者  ', '合成 利用者'],
    ['trimmed NBSP', '\u00a0合成利用者\u00a0', '合成利用者'],
    ['trimmed IDEOGRAPHIC SPACE', '\u3000合成利用者\u3000', '合成利用者'],
    ['trimmed BOM', '\ufeff合成利用者\ufeff', '合成利用者'],
    ['internal whitespace', '合成\u00a0利用者', '合成\u00a0利用者'],
    ['Unicode emoji', '学習者😀', '学習者😀'],
  ])('accepts %s', (_label, input, expected) => {
    expect(validateDisplayName(input)).toEqual({ success: true, displayName: expected })
  })

  it.each([
    ['non-string', null, 'type'],
    ['empty', '', 'empty'],
    ['spaces only', '   ', 'empty'],
    ['fifty-one characters', '名'.repeat(DISPLAY_NAME_MAX_LENGTH + 1), 'too-long'],
    ['newline', '合成\n利用者', 'control-character'],
    ['tab', '合成\t利用者', 'control-character'],
    ['delete control', `合成${String.fromCharCode(0x7f)}利用者`, 'control-character'],
    ['C1 control', `合成${String.fromCharCode(0x85)}利用者`, 'control-character'],
  ])('rejects %s', (_label, input, reason) => {
    expect(validateDisplayName(input)).toEqual({ success: false, reason })
  })

  it('rejects owner IDs and extra fields in update requests', () => {
    expect(validateDisplayNameRequest({
      displayName: '合成利用者',
      userId: '22222222-2222-4222-8222-222222222222',
    })).toEqual({ success: false, reason: 'type' })
  })

  it('accepts only normalized stored profiles with database timestamps', () => {
    expect(validateStoredProfile({
      displayName: '合成利用者',
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:01:00.000Z',
    })).toEqual({
      displayName: '合成利用者',
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:01:00.000Z',
    })
    expect(validateStoredProfile({
      displayName: ' 合成利用者 ',
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:01:00.000Z',
    })).toBeNull()
    for (const whitespace of ['\u00a0', '\u3000', '\ufeff']) {
      expect(validateStoredProfile({
        displayName: `${whitespace}合成利用者${whitespace}`,
        createdAt: '2026-09-06T00:00:00.000Z',
        updatedAt: '2026-09-06T00:01:00.000Z',
      })).toBeNull()
    }
  })
})
