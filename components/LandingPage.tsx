'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { nanoid } from 'nanoid'

export default function LandingPage() {
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')
  const router = useRouter()

  const handleCreateGroup = () => {
    if (!groupName.trim() || !userName.trim()) return

    const groupCode = nanoid(4)
    const group = {
      name: groupName,
      members: [userName],
      code: groupCode
    }

    // Store group data in localStorage (in a real app, this would be sent to a server)
    localStorage.setItem('group', JSON.stringify(group))

    // Navigate to the main app page
    router.push('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="p-8 bg-white shadow-lg rounded-lg max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-700">
            Welcome to LunchVote
          </h2>
          <p className="mt-2 text-center text-sm text-blue-500">
            Create a group to start voting on restaurants
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <Label htmlFor="groupName" className="text-blue-600">Group Name</Label>
            <Input
              id="groupName"
              name="groupName"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-blue-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="userName" className="text-blue-600">Your Name</Label>
            <Input
              id="userName"
              name="userName"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-blue-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateGroup}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!groupName.trim() || !userName.trim()}
          >
            Create Group & Continue
          </Button>
        </div>
      </Card>
    </div>
  )
}

