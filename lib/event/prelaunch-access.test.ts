import { describe, expect, test } from 'bun:test'
import { PRELAUNCH_PATH, decidePrelaunchAccess } from './prelaunch-access'

const LAUNCH = new Date('2025-12-01T00:00:00+07:00')
const BEFORE = LAUNCH.getTime() - 1
const AT = LAUNCH.getTime()
const AFTER = LAUNCH.getTime() + 1

describe('decidePrelaunchAccess before launch (F005 FR-102, FR-103, BR-003)', () => {
  test('locks regular, protected, nested and unknown paths', () => {
    for (const path of ['/', '/awards-information', '/sun-kudos', '/admin', '/admin/users', '/does-not-exist', '/todo']) {
      expect(decidePrelaunchAccess(path, BEFORE, LAUNCH)).toBe('lock')
    }
  })

  test('keeps /prelaunch, /login and /auth/* reachable', () => {
    for (const path of [PRELAUNCH_PATH, '/login', '/auth/callback', '/auth/signout']) {
      expect(decidePrelaunchAccess(path, BEFORE, LAUNCH)).toBe('pass')
    }
  })

  test('keeps Next internals under /_next/ reachable', () => {
    expect(decidePrelaunchAccess('/_next/webpack-hmr', BEFORE, LAUNCH)).toBe('pass')
  })

  test('only the exact exempt paths are open, not look-alikes', () => {
    for (const path of ['/prelaunch/x', '/login/extra', '/loginx', '/auth', '/authx', '/_nextx', '/PRELAUNCH']) {
      expect(decidePrelaunchAccess(path, BEFORE, LAUNCH)).toBe('lock')
    }
  })
})

describe('decidePrelaunchAccess at and after launch (F005 FR-104, FR-106, BR-005)', () => {
  test('now == launch counts as launched', () => {
    expect(decidePrelaunchAccess('/', AT, LAUNCH)).toBe('pass')
    expect(decidePrelaunchAccess(PRELAUNCH_PATH, AT, LAUNCH)).toBe('unlock')
  })

  test('after launch every path passes to the regular guards', () => {
    for (const path of ['/', '/login', '/admin', '/prelaunch/x', '/does-not-exist']) {
      expect(decidePrelaunchAccess(path, AFTER, LAUNCH)).toBe('pass')
    }
  })

  test('after launch /prelaunch sends the visitor home', () => {
    expect(decidePrelaunchAccess(PRELAUNCH_PATH, AFTER, LAUNCH)).toBe('unlock')
  })
})

describe('decidePrelaunchAccess with missing or invalid SITE_LAUNCH_AT (F005 BR-001)', () => {
  test('never locks', () => {
    for (const path of ['/', '/admin', '/does-not-exist']) {
      expect(decidePrelaunchAccess(path, 0, null)).toBe('pass')
    }
  })

  test('/prelaunch has no purpose and redirects home', () => {
    expect(decidePrelaunchAccess(PRELAUNCH_PATH, 0, null)).toBe('unlock')
  })
})
