import type { ReactNode } from 'react'
import { AWARD_CATEGORIES, awardHref } from '@/lib/awards/award-categories'
import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import type { HomeScreenProps } from '../_components/home-screen'

const AWARDS_PATH = '/awards-information'
const KUDOS_PATH = '/sun-kudos'
const ROOT_FURTHER_PARAGRAPHS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const
// Figma: three paragraphs, then the proverb, then the rest.
const QUOTE_AFTER = 3

type BuildInput = {
  dict: Dictionary
  /** Rendered countdown (client component); date is already formatted (dd/MM/yyyy or "—"). */
  countdown: ReactNode
  eventDate: string
}

/** Maps dictionary copy + award catalogue onto the presentational HomeScreen props. */
export function buildHomeScreenProps({ dict, countdown, eventDate }: BuildInput): HomeScreenProps {
  return {
    hero: {
      countdown,
      event: {
        dateLabel: dict['home.event.dateLabel'],
        date: eventDate,
        venueLabel: dict['home.event.venueLabel'],
        venue: dict['home.event.venue'],
        livestream: dict['home.event.livestream'],
      },
      ctas: {
        awards: { href: AWARDS_PATH, label: dict['home.cta.awards'] },
        kudos: { href: KUDOS_PATH, label: dict['home.cta.kudos'] },
      },
    },
    rootFurther: {
      paragraphs: ROOT_FURTHER_PARAGRAPHS.map((p) => dict[`home.rootFurther.${p}`]),
      quote: dict['home.rootFurther.quote'],
      quoteAfter: QUOTE_AFTER,
    },
    awards: {
      caption: dict['home.awards.caption'],
      title: dict['home.awards.title'],
      detailLabel: dict['home.awards.detail'],
      items: AWARD_CATEGORIES.map((award) => ({
        slug: award.slug,
        title: dict[award.titleKey],
        description: dict[award.descriptionKey],
        imageSrc: award.imageSrc,
        href: awardHref(award.slug),
      })),
    },
    kudos: {
      eyebrow: dict['home.kudos.eyebrow'],
      title: dict['home.kudos.title'],
      body: dict['home.kudos.body'],
      detailLabel: dict['home.kudos.detail'],
      href: KUDOS_PATH,
      imageAlt: dict['home.kudos.imageAlt'],
    },
  }
}
