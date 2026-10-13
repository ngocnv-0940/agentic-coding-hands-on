export type CountdownDisplayProps = {
  days: string
  hours: string
  minutes: string
  labels: { days: string; hours: string; minutes: string }
  /** null hides the "Coming soon" caption (event started or invalid date). */
  comingSoonText: string | null
  /** 'prelaunch' enlarges tiles/labels at >= 1024px (Figma 2268:35139); omitted keeps the homepage look. */
  size?: CountdownSize
}

export type CountdownSize = 'default' | 'prelaunch'

// Default strings are the original homepage classes; 'prelaunch' only appends lg: overrides.
const TILE_CLASS: Record<CountdownSize, string> = {
  default: 'relative flex h-14 w-9 md:h-[82px] md:w-[51px] items-center justify-center',
  prelaunch: 'relative flex h-14 w-9 md:h-[82px] md:w-[51px] lg:h-[123px] lg:w-[77px] items-center justify-center',
}
const TILE_BG_CLASS: Record<CountdownSize, string> = {
  default:
    'absolute inset-0 rounded-lg border-[0.5px] border-saa-gold bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,0.1)_100%)] opacity-50 backdrop-blur-[16.6px]',
  prelaunch:
    'absolute inset-0 rounded-lg lg:rounded-xl border-[0.5px] lg:border-[0.75px] border-saa-gold bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,0.1)_100%)] opacity-50 backdrop-blur-[16.6px] lg:backdrop-blur-[24.96px]',
}
const DIGIT_CLASS: Record<CountdownSize, string> = {
  default: 'relative font-[family-name:var(--font-digital)] text-[32px] leading-none md:text-[49px] text-white',
  prelaunch:
    'relative font-[family-name:var(--font-digital)] text-[32px] leading-none md:text-[49px] lg:text-[73.73px] text-white',
}
const UNIT_CLASS: Record<CountdownSize, string> = {
  default: 'flex flex-col justify-center gap-2 md:gap-3.5',
  prelaunch: 'flex flex-col justify-center gap-2 md:gap-3.5 lg:gap-[21px]',
}
const TILES_CLASS: Record<CountdownSize, string> = {
  default: 'flex items-center gap-1.5 md:gap-3.5',
  prelaunch: 'flex items-center gap-1.5 md:gap-3.5 lg:gap-[21px]',
}
const LABEL_CLASS: Record<CountdownSize, string> = {
  default: 'font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold text-white md:text-2xl md:leading-8',
  prelaunch:
    'font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold text-white md:text-2xl md:leading-8 lg:text-4xl lg:leading-12',
}
const ROW_CLASS: Record<CountdownSize, string> = {
  default: 'flex items-center gap-3 md:gap-10',
  prelaunch: 'flex items-center gap-3 md:gap-10 lg:gap-[60px]',
}

function DigitTile({ digit, size }: { digit: string; size: CountdownSize }) {
  return (
    // mm:2167:9040
    <span className={TILE_CLASS[size]}>
      {/* mm:I2167:9040;186:2616 */}
      <span
        aria-hidden="true"
        className={TILE_BG_CLASS[size]}
      />
      {/* mm:I2167:9040;186:2617 */}
      <span className={DIGIT_CLASS[size]}>{digit}</span>
    </span>
  )
}

function Unit({ testId, value, label, size }: { testId: string; value: string; label: string; size: CountdownSize }) {
  return (
    // mm:2167:9038 / 2167:9043 / 2167:9048
    <div className={UNIT_CLASS[size]}>
      {/* mm:2167:9039 */}
      <span data-testid={testId} className={TILES_CLASS[size]}>
        {value.split('').map((digit, i) => (
          <DigitTile key={i} digit={digit} size={size} />
        ))}
      </span>
      {/* mm:2167:9042 */}
      <span className={LABEL_CLASS[size]}>{label}</span>
    </div>
  )
}

export function CountdownDisplay({ days, hours, minutes, labels, comingSoonText, size = 'default' }: CountdownDisplayProps) {
  return (
    // mm:2167:9035
    <div className="flex flex-col gap-4">
      {/* mm:2167:9036 */}
      {comingSoonText !== null && (
        <p data-testid="countdown-coming-soon" className="font-[family-name:var(--font-montserrat)] text-2xl leading-8 font-bold text-white">
          {comingSoonText}
        </p>
      )}
      {/* mm:2167:9037 */}
      <div className={ROW_CLASS[size]}>
        <Unit testId="countdown-days" value={days} label={labels.days} size={size} />
        <Unit testId="countdown-hours" value={hours} label={labels.hours} size={size} />
        <Unit testId="countdown-minutes" value={minutes} label={labels.minutes} size={size} />
      </div>
    </div>
  )
}
