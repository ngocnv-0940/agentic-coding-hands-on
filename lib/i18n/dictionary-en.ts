import { homeEn } from './dictionary-home-en'
import { awardsEn } from './dictionary-awards-en'
import { kudosEn } from './dictionary-kudos-en'
import { writeKudoEn } from './dictionary-write-kudo-en'
import type { Dictionary } from './dictionary-vi'

export const en: Dictionary = {
  'meta.title': 'Sign in - SAA 2025',
  'login.logoAlt': 'Sun* Annual Awards 2025',
  'login.title': 'ROOT FURTHER',
  'login.subtitle': 'Start your journey with SAA 2025.',
  'login.tagline': 'Login to explore!',
  'login.button': 'LOGIN With Google',
  'login.loading': 'Signing in...',
  'login.error': 'Sign-in failed. Please try again.',
  'login.footer': 'Copyright © 2025 Sun* All rights reserved',
  'language.vi': 'VN',
  'language.en': 'EN',
  'language.menu': 'Select language',
  'todo.title': 'To-do',
  'todo.emailLabel': 'Email',
  'todo.logout': 'Logout',
  'todo.emailMissing': '—',
  'prelaunch.title': 'Event starts in',
  'prelaunch.metaTitle': 'SAA 2025',
  ...homeEn,
  ...awardsEn,
  ...kudosEn,
  ...writeKudoEn,
}
