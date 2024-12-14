'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Share2, Clock, ChevronRight, Crown } from 'lucide-react'
import RestaurantList from '@/components/RestaurantList'
import VotingSystem from '@/components/VotingSystem'

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  image?: string;
}

interface GroupData {
  name: string;
  members: string[];
  code: string;
  restaurants?: Restaurant[];
}

export default function GroupPage() {
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [copied, setCopied] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Pizza Palace',
      cuisine: 'Italian',
      rating: 4.5,
      priceRange: '$$',
    },
    {
      id: '2',
      name: 'Sushi Wave',
      cuisine: 'Japanese',
      rating: 4.8,
      priceRange: '$$$',
    },
    {
      id: '3',
      name: 'Burger Joint',
      cuisine: 'American',
      rating: 4.2,
      priceRange: '$',
    },
  ])

  useEffect(() => {
    const data = localStorage.getItem('group')
    if (data) {
      setGroupData(JSON.parse(data))
    }
  }, [])

  const handleCopyLink = () => {
    if (groupData) {
      navigator.clipboard.writeText(`Join my group "${groupData.name}" with code: ${groupData.code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!groupData) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header Section */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-white">{groupData.name}</h1>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Active
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{groupData.members.length} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>5 min left</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-slate-700 hover:border-blue-500/50 transition-colors group"
            >
              <Share2 className="w-4 h-4 mr-2 group-hover:text-blue-400" />
              {copied ? 'Copied!' : 'Share Group'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">
            {/* Members Card */}
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Members
              </h2>
              <div className="space-y-3">
                {groupData.members.map((member, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-300">
                    {index === 0 ? (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    <span>{member}</span>
                    {index === 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Host
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Group Info Card */}
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <h2 className="text-lg font-semibold text-white mb-4">Group Info</h2>
              <div className="space-y-3 text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Group Code</span>
                  <Badge variant="outline" className="font-mono">
                    {groupData.code}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status</span>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    Voting Open
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8 space-y-8">
            {/* Restaurant List */}
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">Restaurants</h2>
                <Button 
                  onClick={() => {
                    const newRestaurant: Restaurant = {
                      id: `${Date.now()}`,
                      name: 'New Restaurant',
                      cuisine: 'Various',
                      rating: 4.0,
                      priceRange: '$$',
                    }
                    setRestaurants(prev => [...prev, newRestaurant])
                  }}
                  variant="outline" 
                  className="border-slate-700"
                >
                  Add Restaurant
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <RestaurantList restaurants={restaurants} />
            </Card>

            {/* Voting Section */}
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <h2 className="text-lg font-semibold text-white mb-6">Cast Your Vote</h2>
              <VotingSystem restaurants={restaurants} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

