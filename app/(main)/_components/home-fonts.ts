import { Montserrat, Montserrat_Alternates, Orbitron } from 'next/font/google'

// Figma: Montserrat 400/500/700 (all copy), Montserrat Alternates 700 (footer copyright).
// "Digital Numbers" (countdown digits) is not on Google Fonts; Orbitron is the closest hosted
// digital-display face, exposed as --font-digital.
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

const digital = Orbitron({
  variable: '--font-digital',
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
})

export const homeFontClassName = `${montserrat.variable} ${montserratAlternates.variable} ${digital.variable}`
