'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GroupInfo from '../../components/GroupInfo'
import RestaurantList from '../../components/RestaurantList'
import VotingSystem from '../../components/VotingSystem'
import { ErrorBoundary } from 'react-error-boundary'

export default function AppPage() {
  const [group, setGroup] = useState<{ name: string; members: string[]; code: string } | null>(null)
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    console.log('Component mounted')
    setIsClient(true)
    try {
      const storedGroup = localStorage.getItem('group')
      console.log('Stored group:', storedGroup)
      if (storedGroup) {
        setGroup(JSON.parse(storedGroup))
      } else {
        console.log('No stored group, redirecting...')
        router.push('/')
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/')
    }
  }, [router])

  if (!isClient || !group) {
    return <div>Loading...</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 py-8">
      <div className="container mx-auto px-4">
        <Card className="p-6 bg-white shadow-lg rounded-lg">
          <h1 className="text-3xl font-bold mb-6 text-blue-600">LunchVote</h1>
          <GroupInfo group={group} />
          <Tabs defaultValue="restaurants" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-blue-100">
              <TabsTrigger value="restaurants" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Restaurants</TabsTrigger>
              <TabsTrigger value="voting" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Voting</TabsTrigger>
            </TabsList>
            <TabsContent value="restaurants">
              <RestaurantList group={group} />
            </TabsContent>
            <TabsContent value="voting">
              <VotingSystem group={group} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  )
}

