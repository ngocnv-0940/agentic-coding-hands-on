/** Stars shown next to a person's name. */
export type StarCount = 0 | 1 | 2 | 3

/** ALG-002 / BR-009: 10, 20 and 50 received kudos earn 1, 2 and 3 stars; fewer than 10 earns none. */
export function starsFor(receivedCount: number): StarCount {
  if (receivedCount >= 50) return 3
  if (receivedCount >= 20) return 2
  if (receivedCount >= 10) return 1
  return 0
}
