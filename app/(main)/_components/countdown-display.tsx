export type CountdownDisplayProps = {
  days: string
  hours: string
  minutes: string
  labels: { days: string; hours: string; minutes: string }
  /** null hides the "Coming soon" caption (event started or invalid date). */
  comingSoonText: string | null
}

function DigitTile({ digit }: { digit: string }) {
  return (
    // mm:2167:9040
    <span className="relative flex h-14 w-9 md:h-[82px] md:w-[51px] items-center justify-center">
      {/* mm:I2167:9040;186:2616 */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-lg border-[0.5px] border-saa-gold bg-[linear-gradient(180deg,#fff_0%,rgba(255,255,255,0.1)_100%)] opacity-50 backdrop-blur-[16.6px]"
      />
      {/* mm:I2167:9040;186:2617 */}
      <span className="relative font-[family-name:var(--font-digital)] text-[32px] leading-none md:text-[49px] text-white">{digit}</span>
    </span>
  )
}

function Unit({ testId, value, label }: { testId: string; value: string; label: string }) {
  return (
    // mm:2167:9038 / 2167:9043 / 2167:9048
    <div className="flex flex-col justify-center gap-2 md:gap-3.5">
      {/* mm:2167:9039 */}
      <span data-testid={testId} className="flex items-center gap-1.5 md:gap-3.5">
        {value.split('').map((digit, i) => (
          <DigitTile key={i} digit={digit} />
        ))}
      </span>
      {/* mm:2167:9042 */}
      <span className="font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold text-white md:text-2xl md:leading-8">{label}</span>
    </div>
  )
}

export function CountdownDisplay({ days, hours, minutes, labels, comingSoonText }: CountdownDisplayProps) {
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
      <div className="flex items-center gap-3 md:gap-10">
        <Unit testId="countdown-days" value={days} label={labels.days} />
        <Unit testId="countdown-hours" value={hours} label={labels.hours} />
        <Unit testId="countdown-minutes" value={minutes} label={labels.minutes} />
      </div>
    </div>
  )
}
