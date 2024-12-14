'use client'

import LandingPage from '../components/LandingPage'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const handleGroupCreation = () => {
    // After successful group creation
    router.push('/group')
  }

  return <LandingPage onGroupCreated={handleGroupCreation} />
}

