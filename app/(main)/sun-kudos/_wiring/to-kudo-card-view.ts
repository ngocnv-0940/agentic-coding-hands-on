import { starsFor } from '@/lib/kudos/hero-stars'
import { formatKudoTime } from '@/lib/kudos/kudo-display-format'
import type { KudoCard, Person } from '@/lib/kudos/kudo-board-types'
import type { KudoCardView, PersonView } from '../_components/kudos-view-types'

const toPersonView = (person: Person): PersonView => ({ ...person, stars: starsFor(person.receivedCount) })

/**
 * RPC row -> card view: adds the star count (ALG-002) and the `HH:mm - MM/DD/YYYY` label (BR-010). Pure, so the
 * server-rendered first page and the pages a Server Action appends later map identically.
 */
export function toKudoCardView(card: KudoCard): KudoCardView {
  return { ...card, sender: toPersonView(card.sender), receiver: toPersonView(card.receiver), timeLabel: formatKudoTime(card.createdAt) }
}
