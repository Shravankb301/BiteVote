"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, Utensils } from 'lucide-react'
import RandomizerWheel from '@/components/RandomizerWheel'
import { motion, AnimatePresence } from 'framer-motion'

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  vicinity?: string;
  icon?: string;
}

interface RestaurantApiResponse {
  id: string;
  name: string;
  cuisine: string;
  vicinity: string;
}

export default function RandomizerPage() {
  const [spinning, setSpinning] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get location on component mount
  useEffect(() => {
    const getInitialLocation = async () => {
      setIsLoading(true);
      try {
        // Get current position
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Fetch initial restaurants
        const searchParams = new URLSearchParams({
          lat: location.lat.toString(),
          lng: location.lng.toString(),
          radius: '5000'
        });

        const response = await fetch(`/api/restaurants?${searchParams}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch restaurants');
        }
        
        const formattedRestaurants = data.map((restaurant: RestaurantApiResponse) => ({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          vicinity: restaurant.vicinity,
          icon: getCuisineIcon(restaurant.cuisine)
        }));

        setRestaurants(formattedRestaurants);
      } catch (error) {
        console.error('Error getting location or restaurants:', error);
        setError('Failed to get your location. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    getInitialLocation();
  }, []);

  const getCuisineIcon = (cuisine: string): string => {
    const cuisineIcons: { [key: string]: string } = {
      'Italian': '🍝',
      'Chinese': '🥢',
      'Mexican': '🌮',
      'Japanese': '🍱',
      'Indian': '🍛',
      'American': '🍔',
      'Thai': '🥘',
      'Pizza': '🍕',
      'Breakfast': '🍳',
      'BBQ': '🍖',
      'Seafood': '🦐',
      'Fast Food': '🍟',
      'Asian': '🥡',
      'Sushi': '🍣',
      'default': '🍽️'
    };

    return cuisineIcons[cuisine] || cuisineIcons.default;
  };

  const handleSpin = () => {
    if (spinning || restaurants.length === 0) return;
    setSpinning(true);
    setShowCelebration(false);
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    setSelectedRestaurant(randomIndex);
    
    setTimeout(() => {
      setSpinning(false);
      setShowCelebration(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-8"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-500">
            Restaurant Roulette
          </h1>
          <p className="text-slate-300">Spin to discover your next dining destination!</p>
        </motion.div>

        <div className="max-w-xl mx-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-slate-400">Finding nearby restaurants...</p>
            </div>
          ) : restaurants.length > 0 ? (
            <motion.div 
              className="flex flex-col items-center space-y-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="relative p-8 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 shadow-xl">
                <RandomizerWheel 
                  segments={restaurants.length}
                  onSpin={handleSpin}
                  spinning={spinning}
                  selectedSegment={selectedRestaurant}
                />
                
                <AnimatePresence>
                  {showCelebration && selectedRestaurant !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center space-y-2 bg-black/80 p-4 rounded-lg backdrop-blur-sm">
                        <div className="text-4xl">{restaurants[selectedRestaurant].icon}</div>
                        <h2 className="text-xl font-bold text-white">{restaurants[selectedRestaurant].name}</h2>
                        <p className="text-slate-300">{restaurants[selectedRestaurant].cuisine}</p>
                        {restaurants[selectedRestaurant].vicinity && (
                          <p className="text-sm text-slate-400">{restaurants[selectedRestaurant].vicinity}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleSpin}
                  disabled={spinning}
                  size="lg"
                  className={`
                    relative px-8 py-6 text-lg font-semibold
                    ${spinning 
                      ? 'bg-slate-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 shadow-lg hover:shadow-pink-500/25'
                    }
                  `}
                >
                  {spinning ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Spinning...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Spin the Wheel!
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  )
}