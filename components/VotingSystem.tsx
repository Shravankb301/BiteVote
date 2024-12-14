import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
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
    <div className="space-y-6">
      <div className="grid gap-4">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id} className="p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-blue-700">{restaurant.name}</h3>
                <p className="text-sm text-blue-500">
                  {restaurant.cuisine} · Rating: {restaurant.rating}
                </p>
                <p className="text-sm text-blue-600">Votes: {votes[restaurant.id] || 0}</p>
              </div>
              <Button onClick={() => handleVote(restaurant.id)} className="bg-blue-500 hover:bg-blue-600 text-white">
                Vote
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {winningRestaurant && (
        <Card className="p-4 border-2 border-yellow-500 bg-yellow-50">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-yellow-700">Current Winner</h3>
            <div className="flex items-center justify-between">
              <p className="text-yellow-600">{winningRestaurant.name}</p>
              <Badge variant="secondary" className="bg-yellow-200 text-yellow-700">
                {votes[winningRestaurant.id]} votes
              </Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

