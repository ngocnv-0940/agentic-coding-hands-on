import Image from 'next/image'

export type LoginButtonProps = {
  label: string
  loadingLabel: string
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function LoginButton({ label, loadingLabel, loading = false, disabled = false, onClick }: LoginButtonProps) {
  return (
    // mm:662:14426
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className="flex h-[60px] w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#FFEA9E] px-6 py-4 [box-shadow:none] transition-shadow duration-200 hover:[box-shadow:0_4px_20px_rgba(255,234,158,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:[box-shadow:none]"
    >
      {/* mm:I662:14426;186:1935 */}
      <span className="flex items-center gap-1">
        {/* mm:I662:14426;186:1568 */}
        <span className="shrink-0 whitespace-nowrap md:w-[225px] md:text-center font-[family-name:var(--font-montserrat)] text-lg leading-7 font-bold text-[#00101A] md:text-[22px]">
          {label}
        </span>
      </span>
      {loading ? (
        <span role="status" className="inline-flex size-6 items-center justify-center">
          <svg className="size-6 animate-spin text-[#00101A]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="sr-only">{loadingLabel}</span>
        </span>
      ) : (
        // mm:I662:14426;186:1766
        <Image src="/images/login/google.svg" alt="" width={24} height={24} unoptimized />
      )}
    </button>
  )
}
