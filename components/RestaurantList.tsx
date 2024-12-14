"use client"
import React from 'react'

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  image?: string;
}

interface RestaurantListProps {
  restaurants: Restaurant[];
}

export default function RestaurantList({ restaurants }: RestaurantListProps) {
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
              <span>{restaurant.priceRange}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

