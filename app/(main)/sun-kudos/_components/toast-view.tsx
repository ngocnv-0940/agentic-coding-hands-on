import type { ToastViewProps } from './kudos-view-types'

/** Short confirmation or error line (E31). Renders nothing while `message` is null; the wiring owns the timer. */
export function ToastView({ message, kind }: ToastViewProps) {
  if (!message) return null
  return (
    <div
      data-testid="kudos-toast"
      role={kind === 'error' ? 'alert' : 'status'}
      className={`fixed bottom-8 left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg border bg-[#00070c] px-6 py-4 text-center font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold shadow-lg ${
        kind === 'error' ? 'border-[#d4271d] text-[#ff8a85]' : 'border-saa-gold-border text-saa-gold'
      }`}
    >
      {message}
    </div>
  )
}
