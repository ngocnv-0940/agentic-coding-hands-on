import Image from 'next/image'
import type { ReactNode } from 'react'
import { homeFontClassName } from '../../(main)/_components/home-fonts'

export type PrelaunchScreenProps = {
  /** Heading above the countdown, e.g. "Sự kiện sẽ bắt đầu sau". */
  title: string
  /** Countdown slot; caller renders <CountdownDisplay size="prelaunch" comingSoonText={null} />. */
  countdown: ReactNode
}

export function PrelaunchScreen({ title, countdown }: PrelaunchScreenProps) {
  return (
    // mm:2268:35127
    <main
      data-testid="prelaunch-screen"
      className={`${homeFontClassName} relative min-h-screen w-full overflow-hidden bg-[#00101A]`}
    >
      {/* mm:2268:35129 */}
      <Image
        data-testid="prelaunch-background"
        src="/images/prelaunch/prelaunch-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* mm:2268:35130 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(18deg,#00101A_15.48%,rgba(0,18,29,0.46)_52.13%,rgba(0,19,32,0)_63.41%)]"
      />
      {/* mm:2268:35131 */}
      <div className="absolute inset-x-0 top-[20.24%] flex flex-col items-center justify-center gap-6 px-4 py-24 md:px-12 lg:px-36">
        {/* mm:2268:35137 */}
        <h1 className="text-center font-[family-name:var(--font-montserrat)] text-2xl leading-8 font-bold text-white md:text-4xl md:leading-12">
          {title}
        </h1>
        {/* mm:2268:35138 */}
        {countdown}
      </div>
    </main>
  )
}
