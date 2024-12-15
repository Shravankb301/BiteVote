"use client"
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  image?: string;
  dietary: string[];
}

interface VotingSystemProps {
  restaurants: Restaurant[];
  onRemoveRestaurant: (id: string) => void;
}

export default function VotingSystem({ restaurants, onRemoveRestaurant }: VotingSystemProps) {
  const [votes, setVotes] = useState<Record<string, number>>({})

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 group"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">{restaurant.name}</h3>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setVotes(prev => ({
                    ...prev,
                    [restaurant.id]: (prev[restaurant.id] || 0) + 1
                  }))}
                  variant="outline" 
                  className="border-slate-700 hover:border-blue-500/50 transition-colors"
                >
                  Vote ({votes[restaurant.id] || 0})
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRestaurant(restaurant.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{restaurant.cuisine}</span>
              <span>•</span>
              <span>{restaurant.priceRange}</span>
              <span>•</span>
              <span className="text-yellow-400">{'⭐'.repeat(Math.floor(restaurant.rating))}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {restaurant.dietary.map((diet, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs bg-slate-700/50"
                >
                  {diet}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ))}

      {restaurants.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No restaurants added yet. Use the search to add restaurants.
        </div>
      )}
    </div>
  )
}

