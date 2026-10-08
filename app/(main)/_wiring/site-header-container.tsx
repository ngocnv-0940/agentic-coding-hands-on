'use client'

import { LanguageSelectorContainer } from '@/app/login/language-selector-container'
import type { Locale } from '@/lib/i18n/locale-config'
import { AccountMenu } from '../_behavior/account-menu'
import { NotificationsMenu } from '../_behavior/notifications-menu'
import { useSiteNavigation, type NavKey } from '../_behavior/use-site-navigation'
import { HeaderIconButton } from '../_components/header-icon-button'
import type { NavItem } from '../_components/header-nav'
import { SiteHeader } from '../_components/site-header'

export type SiteHeaderContainerProps = {
  locale: Locale
  isAdmin: boolean
  logoAlt: string
  navItems: { key: NavKey; href: string; label: string }[]
  notificationLabels: { trigger: string; title: string; empty: string }
  accountLabels: { trigger: string; profile: string; signOut: string; admin: string }
  languageLabels: { vi: string; en: string; menu: string }
}

/** Client wiring: active nav from the URL (layouts persist across navigation) + the menus' triggers. */
export function SiteHeaderContainer({
  locale,
  isAdmin,
  logoAlt,
  navItems,
  notificationLabels,
  accountLabels,
  languageLabels,
}: SiteHeaderContainerProps) {
  const { activeKey, onNavClick } = useSiteNavigation()
  const nav: NavItem[] = navItems.map((item) => ({ ...item, active: item.key === activeKey }))

  return (
    <SiteHeader
      logoAlt={logoAlt}
      nav={nav}
      onNavClick={onNavClick}
      notifications={
        <NotificationsMenu
          labels={notificationLabels}
          renderTrigger={(props) => <HeaderIconButton icon="bell" {...props} />}
        />
      }
      languageSelector={<LanguageSelectorContainer locale={locale} labels={languageLabels} />}
      account={
        <AccountMenu
          isAdmin={isAdmin}
          labels={accountLabels}
          renderTrigger={(props) => <HeaderIconButton icon="account" {...props} />}
        />
      }
    />
  )
}
