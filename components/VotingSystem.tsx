"use client"
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"

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

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
        >
          <div>
            <h3 className="font-medium text-white">{restaurant.name}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{restaurant.cuisine}</span>
              <span>{votes[restaurant.id] || 0} votes</span>
            </div>
          </div>
          <Button 
            onClick={() => setVotes(prev => ({
              ...prev,
              [restaurant.id]: (prev[restaurant.id] || 0) + 1
            }))}
            variant="outline" 
            className="border-slate-700 hover:border-blue-500/50 transition-colors"
          >
            Vote
          </Button>
        </div>
      ))}
    </div>
  )
}

