import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'block',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: 'Team Lunch Decider',
  description: 'Decide where to eat with your team',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body suppressHydrationWarning className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

