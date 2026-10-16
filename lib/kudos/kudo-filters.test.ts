import { describe, expect, test } from 'bun:test'
import type { FilterOptions } from './kudo-board-types'
import { buildFilterQuery, filtersKey, sanitizeFilters } from './kudo-filters'

const OPTIONS: FilterOptions = {
  hashtags: [
    { slug: 'teamwork', label: '#Teamwork' },
    { slug: 'dedicated', label: '#Dedicated' },
  ],
  departments: [{ code: 'CEVC1', name: 'CEVC1' }],
}

describe('sanitizeFilters (FR-206, D014)', () => {
  test('keeps known hashtag and department values (AND, BR-008)', () => {
    expect(sanitizeFilters({ hashtag: 'teamwork', department: 'CEVC1' }, OPTIONS)).toEqual({
      hashtag: 'teamwork',
      department: 'CEVC1',
    })
  })

  test('absent or empty params mean no filter', () => {
    expect(sanitizeFilters({}, OPTIONS)).toEqual({ hashtag: null, department: null })
    expect(sanitizeFilters({ hashtag: '', department: '' }, OPTIONS)).toEqual({ hashtag: null, department: null })
  })

  test('unknown values are ignored independently, not an error', () => {
    expect(sanitizeFilters({ hashtag: 'nope', department: 'CEVC1' }, OPTIONS)).toEqual({
      hashtag: null,
      department: 'CEVC1',
    })
    expect(sanitizeFilters({ hashtag: 'teamwork', department: "'; drop table" }, OPTIONS)).toEqual({
      hashtag: 'teamwork',
      department: null,
    })
  })

  test('matching is exact and case-sensitive', () => {
    expect(sanitizeFilters({ hashtag: 'Teamwork', department: 'cevc1' }, OPTIONS)).toEqual({
      hashtag: null,
      department: null,
    })
  })

  test('a hashtag label is not accepted in place of its slug', () => {
    expect(sanitizeFilters({ hashtag: '#Teamwork' }, OPTIONS).hashtag).toBeNull()
  })

  test('repeated query keys: the first value wins', () => {
    expect(sanitizeFilters({ hashtag: ['dedicated', 'teamwork'] }, OPTIONS).hashtag).toBe('dedicated')
    expect(sanitizeFilters({ hashtag: ['nope', 'teamwork'] }, OPTIONS).hashtag).toBeNull()
    expect(sanitizeFilters({ hashtag: [] }, OPTIONS).hashtag).toBeNull()
  })

  test('with no options available every value becomes no filter', () => {
    expect(sanitizeFilters({ hashtag: 'teamwork', department: 'CEVC1' }, { hashtags: [], departments: [] })).toEqual({
      hashtag: null,
      department: null,
    })
  })
})

describe('filtersKey', () => {
  test('differs per filter set and is stable for equal sets', () => {
    expect(filtersKey({ hashtag: null, department: null })).toBe('|')
    expect(filtersKey({ hashtag: 'a', department: null })).not.toBe(filtersKey({ hashtag: null, department: 'a' }))
    expect(filtersKey({ hashtag: 'a', department: 'b' })).toBe(filtersKey({ hashtag: 'a', department: 'b' }))
  })
})

describe('buildFilterQuery', () => {
  test('no filter gives an empty query', () => {
    expect(buildFilterQuery({ hashtag: null, department: null })).toBe('')
  })

  test('drops cleared filters and keeps the rest', () => {
    expect(buildFilterQuery({ hashtag: 'teamwork', department: null })).toBe('hashtag=teamwork')
    expect(buildFilterQuery({ hashtag: null, department: 'CEVC1' })).toBe('department=CEVC1')
    expect(buildFilterQuery({ hashtag: 'teamwork', department: 'CEVC1' })).toBe('hashtag=teamwork&department=CEVC1')
  })

  test('encodes values and round-trips through sanitizeFilters', () => {
    const query = buildFilterQuery({ hashtag: 'a&b', department: null })
    expect(query).toBe('hashtag=a%26b')
    const params = Object.fromEntries(new URLSearchParams(query))
    const options = { hashtags: [{ slug: 'a&b', label: 'A&B' }], departments: [] }
    expect(sanitizeFilters(params, options)).toEqual({ hashtag: 'a&b', department: null })
  })
})
