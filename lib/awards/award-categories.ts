export const AWARD_SLUGS = [
  'top-talent',
  'top-project',
  'top-project-leader',
  'best-manager',
  'signature-2025-creator',
  'mvp',
] as const

export type AwardSlug = (typeof AWARD_SLUGS)[number]

export type AwardCategory = {
  slug: AwardSlug
  imageSrc: `/images/homepage/awards/${AwardSlug}.png`
  titleKey: `home.award.${AwardSlug}.title`
  descriptionKey: `home.award.${AwardSlug}.description`
}

export const AWARD_CATEGORIES: readonly AwardCategory[] = AWARD_SLUGS.map((slug) => ({
  slug,
  imageSrc: `/images/homepage/awards/${slug}.png`,
  titleKey: `home.award.${slug}.title`,
  descriptionKey: `home.award.${slug}.description`,
}))

/** Card / title / "Chi tiết" all open the same anchor; no slug → the section root. */
export function awardHref(slug?: string): string {
  return slug ? `/awards-information#${slug}` : '/awards-information'
}
