import type { kudosVi } from './dictionary-kudos-vi'

/** Sun* Kudos live board (/sun-kudos) strings, English (authored; Figma only provides Vietnamese). Key parity with `kudosVi` is compile-time. */
export const kudosEn: { [K in keyof typeof kudosVi]: string } = {
  'kudos.meta.title': 'Sun* Kudos - SAA 2025',
  'kudos.eyebrow': 'Sun* Annual Awards 2025',

  'kudos.banner.title': 'Recognition and thank-you system',
  'kudos.banner.logoLabel': 'SAA 2025 KUDOS',
  'kudos.compose.placeholder': 'Who would you like to thank and recognise today?',
  'kudos.profileSearch.label': 'Search Sunner profile',
  'kudos.modal.close': 'Close',

  'kudos.highlight.title': 'HIGHLIGHT KUDOS',
  'kudos.highlight.empty': 'There are no Kudos yet.',
  'kudos.filter.hashtag': 'Hashtag',
  'kudos.filter.department': 'Department',
  'kudos.filter.clear': 'Clear filter',
  'kudos.carousel.region': 'Highlight Kudos',
  'kudos.carousel.prev': 'Previous Kudos',
  'kudos.carousel.next': 'Next Kudos',

  'kudos.spotlight.title': 'SPOTLIGHT BOARD',
  'kudos.spotlight.kudosSuffix': 'KUDOS',
  'kudos.spotlight.searchPlaceholder': 'Search',
  'kudos.spotlight.searchLabel': 'Search Sunner names on the Spotlight',
  'kudos.spotlight.panZoom': 'Pan/Zoom',
  'kudos.spotlight.recent': 'received a new Kudos',
  'kudos.spotlight.empty': 'No data yet',

  'kudos.feed.title': 'ALL KUDOS',
  'kudos.feed.empty': 'There are no Kudos yet.',
  'kudos.feed.loading': 'Loading...',
  'kudos.feed.error': 'Could not load more Kudos. Scroll down to try again.',

  'kudos.card.detail': 'View details',
  'kudos.card.copyLink': 'Copy Link',
  'kudos.card.imageAlt': 'Attached image',
  'kudos.like.add': 'Like this Kudos',
  'kudos.like.remove': 'Unlike this Kudos',
  'kudos.star.1': 'This Sunner has received 10 Kudos and is starting to spread warm energy to everyone around.',
  'kudos.star.2': 'This Sunner has received 20 Kudos and proves their influence through positive actions every day.',
  'kudos.star.3': 'This Sunner has received 50 Kudos and has become a role model of recognition, sharing and the Sun* spirit.',
  'kudos.hero.new_hero': 'New Hero',
  'kudos.hero.rising_hero': 'Rising Hero',
  'kudos.hero.super_hero': 'Super Hero',
  'kudos.hero.legend_hero': 'Legend Hero',

  'kudos.sidebar.received': 'Kudos you received:',
  'kudos.sidebar.sent': 'Kudos you sent:',
  'kudos.sidebar.hearts': 'Hearts you received:',
  'kudos.sidebar.opened': 'Secret Boxes you opened:',
  'kudos.sidebar.unopened': 'Secret Boxes unopened:',
  'kudos.sidebar.openBox': 'Open Secret Box',
  'kudos.sidebar.giftsTitle': '10 LATEST SUNNERS TO RECEIVE A GIFT',
  'kudos.sidebar.giftsEmpty': 'No data yet',

  'kudos.toast.copied': 'Link copied — ready to share!',
  'kudos.error.copy': 'Could not copy the link. Please try again.',
  'kudos.error.like.self_like': 'You cannot like a Kudos you sent yourself.',
  'kudos.error.like.sunner_not_found': 'Your account has no Sunner profile yet, so you cannot like Kudos.',
  'kudos.error.like.kudo_not_found': 'This Kudos no longer exists.',
  'kudos.error.like.unknown': 'Could not like this Kudos right now. Please try again.',
}
