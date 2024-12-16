"use client"
import React from 'react'

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  dietary: string[];
  image?: string;
}

interface RestaurantListProps {
  restaurants: Restaurant[];
  onRemove: (restaurantId: string) => void;
}

export default function RestaurantList({ restaurants, onRemove }: RestaurantListProps) {
  const getDietaryIcon = (type: string) => {
    switch (type) {
      case 'vegetarian': return '🥗'
      case 'vegan': return '🌱'
      case 'gluten-free': return '🌾'
      case 'halal': return '🥩'
      case 'kosher': return '✡️'
      case 'dairy-free': return '🥛'
      case 'nut-free': return '🥜'
      default: return ''
    }
  }

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <div>
            <h3 className="font-medium text-white">{restaurant.name}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{restaurant.cuisine}</span>
              <span>{'⭐'.repeat(Math.floor(restaurant.rating))}</span>
              <div className="flex gap-1">
                {restaurant.dietary.map((diet, index) => (
                  <span key={index} title={diet} className="cursor-help">
                    {getDietaryIcon(diet)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

