/**
 * Lets the floating action button (rendered by the shared layout) ask the Kudos board to open the Viết Kudo modal
 * without a navigation. The board registers while it is on screen; `requestCompose` returns false when no board is
 * listening, and the caller then navigates to `/sun-kudos?compose=1` instead.
 */
type ComposeHandler = (opener: HTMLElement | null) => void

const handlers: ComposeHandler[] = []
/** The FAB that asked while no board listened (not on /sun-kudos, or not hydrated yet): the board focuses it back after the hop. */
let pendingOpener: HTMLElement | null = null

/** Registers the board's handler; returns the cleanup. The most recent registration answers. */
export function registerComposeHandler(handler: ComposeHandler): () => void {
  handlers.push(handler)
  return () => {
    const index = handlers.indexOf(handler)
    if (index >= 0) handlers.splice(index, 1)
  }
}

/** True when a board took the request (it applies its own sunner gating); false means the caller must navigate. */
export function requestCompose(opener: HTMLElement | null): boolean {
  const handler = handlers[handlers.length - 1]
  if (!handler) {
    pendingOpener = opener
    return false
  }
  handler(opener)
  return true
}

/** The opener remembered by the last unanswered request, once; read by the board when it consumes `?compose=1`. */
export function takePendingOpener(): HTMLElement | null {
  const opener = pendingOpener
  pendingOpener = null
  return opener
}

type ArmedCompose = { opener: HTMLElement | null }
let armed: ArmedCompose | null = null

/**
 * The board saw `?compose=1`. Syncing the URL without the param makes Next re-key the page segment, so the board that saw it
 * may be replaced by a fresh one: the request is parked here and whichever board is mounted once the param is gone opens the
 * modal. Idempotent while armed (StrictMode runs effects twice).
 */
export function armCompose(): void {
  if (armed) return
  armed = { opener: takePendingOpener() }
}

/** Takes the armed request once; null when none. */
export function takeArmedCompose(): ArmedCompose | null {
  const request = armed
  armed = null
  return request
}
