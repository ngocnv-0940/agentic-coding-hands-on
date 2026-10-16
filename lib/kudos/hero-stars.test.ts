import { describe, expect, test } from 'bun:test'
import { starsFor } from './hero-stars'

describe('starsFor (BR-009: 10/20/50 received kudos -> 1/2/3 stars)', () => {
  test.each([
    [0, 0],
    [9, 0],
    [10, 1],
    [19, 1],
    [20, 2],
    [49, 2],
    [50, 3],
    [1000, 3],
  ])('%i received -> %i stars', (received, stars) => {
    expect(starsFor(received)).toBe(stars as 0 | 1 | 2 | 3)
  })
})
