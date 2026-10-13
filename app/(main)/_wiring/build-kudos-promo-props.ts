import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import type { KudosPromoProps } from '../_components/kudos-promo'

/** Where the Sun* Kudos block and the hero CTA lead. */
export const KUDOS_PATH = '/sun-kudos'

/** The Sun* Kudos block copy, shared by the homepage and the Awards Information page. */
export function buildKudosPromoProps(dict: Dictionary): KudosPromoProps {
  return {
    eyebrow: dict['home.kudos.eyebrow'],
    title: dict['home.kudos.title'],
    body: dict['home.kudos.body'],
    detailLabel: dict['home.kudos.detail'],
    href: KUDOS_PATH,
    imageAlt: dict['home.kudos.imageAlt'],
  }
}
