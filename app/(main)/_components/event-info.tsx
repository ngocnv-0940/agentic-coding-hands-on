export type EventInfoProps = {
  dateLabel: string
  date: string
  venueLabel: string
  venue: string
  livestream: string
}

function Field({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    // mm:2167:9055 / 2167:9058
    <p className="flex items-center gap-3 font-[family-name:var(--font-montserrat)] font-bold">
      {/* mm:2167:9056 / 2167:9060 */}
      <span className="text-base leading-6 tracking-[0.15px] text-white">{label}</span>
      {/* mm:2167:9057 / 2167:9059 */}
      <span data-testid={testId} className="text-2xl leading-8 text-saa-gold">
        {value}
      </span>
    </p>
  )
}

export function EventInfo({ dateLabel, date, venueLabel, venue, livestream }: EventInfoProps) {
  return (
    // mm:2167:9053
    <div className="flex flex-col gap-2">
      {/* mm:2167:9054 */}
      <div className="flex flex-wrap items-center gap-x-[60px] gap-y-2">
        <Field label={dateLabel} value={date} testId="event-date" />
        <Field label={venueLabel} value={venue} testId="event-venue" />
      </div>
      {/* mm:2167:9061 */}
      <p data-testid="event-livestream" className="font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.5px] text-white">
        {livestream}
      </p>
    </div>
  )
}
