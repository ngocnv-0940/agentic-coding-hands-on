import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import { getSpotlight } from '@/lib/kudos/kudo-board-queries'
import { formatKudoTime } from '@/lib/kudos/kudo-display-format'
import { positionFor } from '@/lib/kudos/spotlight-node-layout'
import type { SpotlightData } from '@/lib/kudos/kudo-board-types'
import { buildSpotlightTexts } from './build-kudos-labels'
import { SpotlightContainer } from './spotlight-container'

const EMPTY_SPOTLIGHT: SpotlightData = { total: 0, receivers: [], recent: [] }

/** SPOTLIGHT BOARD: ignores the page filters (A8). A failed read shows the empty state in place. */
export async function SpotlightBlock({ dict }: { dict: Dictionary }) {
  let data = EMPTY_SPOTLIGHT
  try {
    data = await getSpotlight()
  } catch (error) {
    console.error('[kudos] spotlight failed', error instanceof Error ? error.name : 'unknown')
  }

  const nodes = data.receivers.map((receiver) => ({
    id: receiver.sunnerId,
    name: receiver.name,
    ...positionFor(receiver.sunnerId),
    href: `/sun-kudos/${receiver.latestKudoId}`,
    tooltip: `${receiver.name} · ${formatKudoTime(receiver.latestCreatedAt)}`,
  }))
  const recent = data.recent.map((entry) => `${formatKudoTime(entry.createdAt).split(' - ')[0]} ${entry.receiverName} ${dict['kudos.spotlight.recent']}`)

  return (
    <SpotlightContainer
      eyebrow={dict['kudos.eyebrow']}
      title={dict['kudos.spotlight.title']}
      total={data.total}
      nodes={nodes}
      recent={recent}
      texts={buildSpotlightTexts(dict)}
    />
  )
}
