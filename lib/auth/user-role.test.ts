import { describe, expect, test } from 'bun:test'
import type { User } from '@supabase/supabase-js'
import { isAdminUser } from './user-role'

const withMeta = (app_metadata: unknown, user_metadata: unknown = {}) =>
  ({ app_metadata, user_metadata }) as unknown as Pick<User, 'app_metadata'>

describe('isAdminUser (DEC-004 / FR-602)', () => {
  test('admin only when app_metadata.role is exactly "admin"', () => {
    expect(isAdminUser(withMeta({ role: 'admin' }))).toBe(true)
  })

  test('other roles, casing variants and missing roles are not admin', () => {
    for (const role of ['user', 'Admin', 'ADMIN', ' admin', '', undefined, ['admin'], true]) {
      expect(isAdminUser(withMeta({ role }))).toBe(false)
    }
  })

  test('user-editable user_metadata never grants admin', () => {
    expect(isAdminUser(withMeta({}, { role: 'admin' }))).toBe(false)
  })

  test('no user or no app_metadata is not admin', () => {
    expect(isAdminUser(null)).toBe(false)
    expect(isAdminUser(undefined)).toBe(false)
    expect(isAdminUser(withMeta(undefined))).toBe(false)
  })
})
