import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { initializeDatabase } from '@/lib/db-indexes'

const inter = Inter({ subsets: ['latin'] })

// Initialize database indexes
initializeDatabase().catch(console.error);

export const metadata = {
  title: 'Team Lunch Decider',
  description: 'Decide where to eat as a team',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

