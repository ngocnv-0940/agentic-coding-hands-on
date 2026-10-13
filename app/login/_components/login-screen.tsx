import Image from 'next/image'
import type { ReactNode } from 'react'
import { loginFontClassName } from './login-fonts'
import { LoginFooter } from './login-footer'
import { LoginHeader } from './login-header'
import { LoginHeroIntro } from './login-hero-intro'

export type LoginScreenProps = {
  title: string
  subtitle: string
  tagline: string
  footerText: string
  logoAlt: string
  languageSelector: ReactNode
  loginArea: ReactNode
}

export function LoginScreen({ title, subtitle, tagline, footerText, logoAlt, languageSelector, loginArea }: LoginScreenProps) {
  return (
    // mm:662:14387
    <div className={`${loginFontClassName} relative min-h-screen w-full overflow-x-clip bg-[#00101A]`}>
      {/* mm:662:14388 */}
      <div data-testid="login-hero" className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* mm:662:14389 */}
        <div className="absolute inset-0 lg:inset-x-0 lg:top-0.5 lg:bottom-auto lg:h-[1022px]">
          <Image
            src="/images/login/key-visual.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[right_center] lg:object-top"
          />
        </div>
        {/* mm:662:14392 */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#00101A_0%,#00101A_25.41%,rgba(0,16,26,0)_100%)]" />
        {/* mm:662:14390 */}
        <div className="absolute inset-x-0 bottom-0 h-[400px] bg-[linear-gradient(0deg,#00101A_0%,rgba(0,19,32,0)_70%)] lg:top-[138px] lg:bottom-auto lg:h-[1093px] lg:bg-[linear-gradient(0deg,#00101A_22.48%,rgba(0,19,32,0)_51.74%)]" />
      </div>
      <LoginHeader logoAlt={logoAlt} languageSelector={languageSelector} />
      <LoginHeroIntro title={title} subtitle={subtitle} tagline={tagline} loginArea={loginArea} />
      <LoginFooter text={footerText} />
    </div>
  )
}
