import type { Page } from '@playwright/test'

/**
 * The app's own inline error alert. Next.js mounts a `role="alert"` route announcer
 * (#__next-route-announcer__) on every page, so a bare getByRole('alert') matches two nodes.
 */
export const appAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)')
