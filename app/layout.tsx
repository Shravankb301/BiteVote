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
  title: 'BitVote',
  description: 'Decide where to eat with your team - Stop the endless group chat debates with real-time voting and seamless bill splitting.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
  themeColor: '#1e1b4b',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.bitevote.com',
    title: 'BitVote - Team Lunch Decision Made Easy',
    description: 'Stop asking "What do you want to eat?" - Make group dining decisions effortless with real-time voting and seamless bill splitting.',
    siteName: 'BitVote',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'BitVote Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BitVote - Team Lunch Decision Made Easy',
    description: 'Stop asking "What do you want to eat?" - Make group dining decisions effortless with real-time voting and seamless bill splitting.',
    images: ['/logo.png'],
    creator: '@shravankb301',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification', // You'll need to add your Google verification code here
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

