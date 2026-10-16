import { Montserrat, Montserrat_Alternates } from 'next/font/google'
import localFont from 'next/font/local'

// Figma: Montserrat 400/500/700 (all copy), Montserrat Alternates 700 (footer copyright).
// "Digital Numbers" (countdown digits, mm:I2268:35141;186:2617) is not on Google Fonts; the OFL-1.1 build by Stephan Ahlf
// (github.com/s-a/digital-numbers-font, licence beside the file) is self-hosted and exposed as --font-digital.
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  subsets: ['latin', 'vietnamese'],
  weight: ['700'],
  display: 'swap',
})

const digital = localFont({
  variable: '--font-digital',
  src: '../../../public/fonts/digital-numbers/DigitalNumbers-Regular.woff',
  weight: '400',
  display: 'swap',
})

export const homeFontClassName = `${montserrat.variable} ${montserratAlternates.variable} ${digital.variable}`
