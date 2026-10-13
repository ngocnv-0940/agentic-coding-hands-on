import type { awardsVi } from '../i18n/dictionary-awards-vi'
import type { AwardSlug } from './award-categories'

/** Dictionary keys of the awards page; a typo or a key missing from `awardsVi` fails tsc. */
type AwardsKey = keyof typeof awardsVi

export type AwardDetail = {
  slug: AwardSlug
  menuLabelKey: AwardsKey
  descriptionKey: AwardsKey
  quantity: { valueKey: AwardsKey; unitKey: AwardsKey }
  /** Signature 2025 has two alternative prizes; `noteKey` is null where Figma shows no note (Best Manager, MVP). */
  prizes: readonly { valueKey: AwardsKey; noteKey: AwardsKey | null }[]
}

/** Same order as AWARD_SLUGS (BR-001). Titles reuse `home.award.<slug>.title`. */
export const AWARD_DETAILS: readonly AwardDetail[] = [
  {
    slug: 'top-talent',
    menuLabelKey: 'awards.menu.top-talent',
    descriptionKey: 'awards.top-talent.description',
    quantity: { valueKey: 'awards.top-talent.quantity', unitKey: 'awards.unit.individual' },
    prizes: [{ valueKey: 'awards.top-talent.prize.1.value', noteKey: 'awards.note.each' }],
  },
  {
    slug: 'top-project',
    menuLabelKey: 'awards.menu.top-project',
    descriptionKey: 'awards.top-project.description',
    quantity: { valueKey: 'awards.top-project.quantity', unitKey: 'awards.unit.team' },
    prizes: [{ valueKey: 'awards.top-project.prize.1.value', noteKey: 'awards.note.each' }],
  },
  {
    slug: 'top-project-leader',
    menuLabelKey: 'awards.menu.top-project-leader',
    descriptionKey: 'awards.top-project-leader.description',
    quantity: { valueKey: 'awards.top-project-leader.quantity', unitKey: 'awards.unit.individual' },
    prizes: [{ valueKey: 'awards.top-project-leader.prize.1.value', noteKey: 'awards.note.each' }],
  },
  {
    slug: 'best-manager',
    menuLabelKey: 'awards.menu.best-manager',
    descriptionKey: 'awards.best-manager.description',
    quantity: { valueKey: 'awards.best-manager.quantity', unitKey: 'awards.unit.individual' },
    prizes: [{ valueKey: 'awards.best-manager.prize.1.value', noteKey: null }],
  },
  {
    slug: 'signature-2025-creator',
    menuLabelKey: 'awards.menu.signature-2025-creator',
    descriptionKey: 'awards.signature-2025-creator.description',
    quantity: { valueKey: 'awards.signature-2025-creator.quantity', unitKey: 'awards.unit.individualOrTeam' },
    prizes: [
      { valueKey: 'awards.signature-2025-creator.prize.1.value', noteKey: 'awards.note.individual' },
      { valueKey: 'awards.signature-2025-creator.prize.2.value', noteKey: 'awards.note.team' },
    ],
  },
  {
    slug: 'mvp',
    menuLabelKey: 'awards.menu.mvp',
    descriptionKey: 'awards.mvp.description',
    quantity: { valueKey: 'awards.mvp.quantity', unitKey: 'awards.unit.individual' },
    prizes: [{ valueKey: 'awards.mvp.prize.1.value', noteKey: null }],
  },
]
