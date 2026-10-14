import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import type { LikeErrorCode } from '@/lib/kudos/kudo-board-types'
import type { KudoCardLabels, SidebarLabels } from '../_components/kudos-view-types'

/** Everything a kudo card needs in words: the view labels plus the like / copy-link texts of the wiring. */
export type KudoCardTexts = {
  labels: KudoCardLabels
  likeAdd: string
  likeRemove: string
  copyLink: string
  copied: string
  copyError: string
}

export type CarouselTexts = { regionLabel: string; prevLabel: string; nextLabel: string; emptyLabel: string }
export type FeedTexts = { empty: string; loading: string; error: string }
export type FilterTexts = { hashtag: string; department: string; clear: string }
export type SpotlightTexts = { panZoom: string; empty: string; searchPlaceholder: string; searchLabel: string }

/** Dictionary -> label props, one builder per block, so the containers never touch dictionary keys (DRY). */
export function buildKudoCardTexts(dict: Dictionary): KudoCardTexts {
  return {
    labels: {
      detail: dict['kudos.card.detail'],
      starTitles: [dict['kudos.star.1'], dict['kudos.star.2'], dict['kudos.star.3']],
      heroTitles: {
        new_hero: dict['kudos.hero.new_hero'],
        rising_hero: dict['kudos.hero.rising_hero'],
        super_hero: dict['kudos.hero.super_hero'],
        legend_hero: dict['kudos.hero.legend_hero'],
      },
      imageAlt: dict['kudos.card.imageAlt'],
    },
    likeAdd: dict['kudos.like.add'],
    likeRemove: dict['kudos.like.remove'],
    copyLink: dict['kudos.card.copyLink'],
    copied: dict['kudos.toast.copied'],
    copyError: dict['kudos.error.copy'],
  }
}

export function buildCarouselTexts(dict: Dictionary): CarouselTexts {
  return {
    regionLabel: dict['kudos.carousel.region'],
    prevLabel: dict['kudos.carousel.prev'],
    nextLabel: dict['kudos.carousel.next'],
    emptyLabel: dict['kudos.highlight.empty'],
  }
}

export function buildFeedTexts(dict: Dictionary): FeedTexts {
  return { empty: dict['kudos.feed.empty'], loading: dict['kudos.feed.loading'], error: dict['kudos.feed.error'] }
}

export function buildFilterTexts(dict: Dictionary): FilterTexts {
  return { hashtag: dict['kudos.filter.hashtag'], department: dict['kudos.filter.department'], clear: dict['kudos.filter.clear'] }
}

export function buildSpotlightTexts(dict: Dictionary): SpotlightTexts {
  return {
    panZoom: dict['kudos.spotlight.panZoom'],
    empty: dict['kudos.spotlight.empty'],
    searchPlaceholder: dict['kudos.spotlight.searchPlaceholder'],
    searchLabel: dict['kudos.spotlight.searchLabel'],
  }
}

export function buildSidebarLabels(dict: Dictionary): SidebarLabels {
  return {
    received: dict['kudos.sidebar.received'],
    sent: dict['kudos.sidebar.sent'],
    hearts: dict['kudos.sidebar.hearts'],
    opened: dict['kudos.sidebar.opened'],
    unopened: dict['kudos.sidebar.unopened'],
    openBox: dict['kudos.sidebar.openBox'],
    giftsTitle: dict['kudos.sidebar.giftsTitle'],
    giftsEmpty: dict['kudos.sidebar.giftsEmpty'],
  }
}

export function buildLikeErrorMessages(dict: Dictionary): Record<LikeErrorCode, string> {
  return {
    self_like: dict['kudos.error.like.self_like'],
    sunner_not_found: dict['kudos.error.like.sunner_not_found'],
    kudo_not_found: dict['kudos.error.like.kudo_not_found'],
    unknown: dict['kudos.error.like.unknown'],
  }
}
