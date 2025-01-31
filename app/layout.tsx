import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import Logo from "@/components/Logo"
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'block',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: 'BiteVote',
  description: 'Decide where to eat with your team',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
  themeColor: '#1e1b4b',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <style>{`
          [data-new-gr-c-s-check-loaded],
          [data-gr-ext-installed] {
            display: revert !important;
          }
        `}</style>
      </head>
      <body 
        className={`${inter.className} min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <div className="relative flex-1">
          <Logo />
          <div className="flex-1">
            {children}
          </div>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

