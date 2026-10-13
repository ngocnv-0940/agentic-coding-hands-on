import { Montserrat, Montserrat_Alternates } from 'next/font/google'

// Figma: Montserrat 700 (header, hero text, button) and Montserrat Alternates 700 (footer).
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'vietnamese'],
  weight: ['700'],
  display: 'swap',
})

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  subsets: ['latin', 'vietnamese'],
  weight: ['700'],
  display: 'swap',
})

export const loginFontClassName = `${montserrat.variable} ${montserratAlternates.variable}`
