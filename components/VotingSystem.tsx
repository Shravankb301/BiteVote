import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  image?: string;
}

interface VotingSystemProps {
  restaurants: Restaurant[];
}

export default function VotingSystem({ restaurants }: VotingSystemProps) {
  const [votes, setVotes] = useState<Record<string, number>>({})

  const handleVote = (restaurantId: string) => {
    setVotes((prevVotes) => ({
      ...prevVotes,
      [restaurantId]: (prevVotes[restaurantId] || 0) + 1,
    }))
  }

  const getWinningRestaurant = () => {
    if (Object.keys(votes).length === 0) return null
    const winningId = Object.keys(votes).reduce((a, b) => (votes[a] > votes[b] ? a : b))
    return restaurants.find((restaurant) => restaurant.id === winningId)
  }

  const winningRestaurant = getWinningRestaurant()

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
        >
          <div>
            <h3 className="font-medium text-white">{restaurant.name}</h3>
            <div className="text-sm text-slate-400">{restaurant.cuisine}</div>
          </div>
          <Button variant="outline" className="border-slate-700">
            Vote
          </Button>
        </div>
      ))}
    </div>
  )
}

