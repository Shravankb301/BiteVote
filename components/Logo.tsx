import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="fixed top-6 left-6 z-50 flex items-center gap-3 hover:opacity-90 transition-opacity">
      <div className="w-16 h-16">
        <Image
          src="/logo.png"
          alt="BitVote Logo"
          width={64}
          height={64}
          className="w-full h-full object-contain"
        />
      </div>
      <span className="text-white font-semibold text-3xl">BitVote</span>
    </Link>
  )
} 