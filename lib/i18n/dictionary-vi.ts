import { homeVi } from './dictionary-home-vi'
import { awardsVi } from './dictionary-awards-vi'
import { kudosVi } from './dictionary-kudos-vi'

export const vi = {
  'meta.title': 'Đăng nhập - SAA 2025',
  'login.logoAlt': 'Sun* Annual Awards 2025',
  'login.title': 'ROOT FURTHER',
  'login.subtitle': 'Bắt đầu hành trình của bạn cùng SAA 2025.',
  'login.tagline': 'Đăng nhập để khám phá!',
  'login.button': 'LOGIN With Google',
  'login.loading': 'Đang đăng nhập...',
  'login.error': 'Đăng nhập không thành công. Vui lòng thử lại.',
  'login.footer': 'Bản quyền thuộc về Sun* © 2025',
  'language.vi': 'VN',
  'language.en': 'EN',
  'language.menu': 'Chọn ngôn ngữ',
  'todo.title': 'Việc cần làm',
  'todo.emailLabel': 'Email',
  'todo.logout': 'Đăng xuất',
  'todo.emailMissing': '—',
  'prelaunch.title': 'Sự kiện sẽ bắt đầu sau',
  'prelaunch.metaTitle': 'SAA 2025',
  ...homeVi,
  ...awardsVi,
  ...kudosVi,
} as const

/** Key set is derived from `vi`; `en` must provide every key (compile-time parity, F002:BR-002). */
export type Dictionary = { [K in keyof typeof vi]: string }
