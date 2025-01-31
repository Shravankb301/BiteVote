import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link 
      href="/" 
      className="absolute top-2 sm:top-4 md:top-6 left-2 sm:left-4 md:left-6 z-50 flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity"
    >
      <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16">
        <Image
          src="/logo.png"
          alt="BitVote Logo"
          width={64}
          height={64}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      <span className="text-white font-semibold text-xl sm:text-2xl md:text-3xl">BitVote</span>
    </Link>
  )
} 