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
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
  themeColor: '#1e1b4b',
  appleWebAppCapable: 'yes',
  formatDetection: {
    telephone: 'no',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <div className="flex-1">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}

