import type { ReactNode } from 'react'
import { AWARD_CATEGORIES } from '@/lib/awards/award-categories'
import { AWARD_DETAILS } from '@/lib/awards/award-details'
import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import type { AwardsInformationScreenProps } from '../_components/awards-information/awards-information-screen'
import { buildKudosPromoProps } from './build-kudos-promo-props'

type BuildInput = {
  dict: Dictionary
  /** Rendered category menu (client component). */
  menu: ReactNode
}

/** Maps dictionary copy + award catalogue + award details onto the presentational AwardsInformationScreen props. */
export function buildAwardsInformationProps({ dict, menu }: BuildInput): AwardsInformationScreenProps {
  return {
    hero: {
      keyvisualAlt: dict['awards.hero.keyvisualAlt'],
      caption: dict['awards.hero.caption'],
      title: dict['awards.hero.title'],
    },
    menu,
    awards: AWARD_DETAILS.map((detail) => {
      const category = AWARD_CATEGORIES.find((c) => c.slug === detail.slug)
      if (!category) throw new Error(`Award "${detail.slug}" has no entry in AWARD_CATEGORIES`)
      return {
        slug: detail.slug,
        title: dict[category.titleKey],
        description: dict[detail.descriptionKey],
        imageSrc: category.imageSrc,
        quantity: { value: dict[detail.quantity.valueKey], unit: dict[detail.quantity.unitKey] },
        prizes: detail.prizes.map((prize) => ({
          value: dict[prize.valueKey],
          note: prize.noteKey ? dict[prize.noteKey] : '',
        })),
      }
    }),
    labels: {
      quantity: dict['awards.label.quantity'],
      prize: dict['awards.label.prize'],
      or: dict['awards.label.or'],
    },
    kudos: buildKudosPromoProps(dict),
  }
}
