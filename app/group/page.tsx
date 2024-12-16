'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Share2, Clock, Loader2, Check } from 'lucide-react'
import VotingSystem from '@/components/VotingSystem'
import { LocationInput } from "@/components/location-input";
import { RestaurantCard } from "@/components/RestaurantCard";
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  dietary: string[];
  image?: string;
}

interface GroupData {
  name: string;
  members: string[];
  code: string;
  restaurants?: Restaurant[];
}

interface SearchResult {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  dietary: string[];
  distance: number;
  vicinity: string;
}

export default function GroupPage() {
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [copied, setCopied] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

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

  const handleRemoveRestaurant = (restaurantId: string) => {
    setRestaurantToDelete(restaurantId)
  }

  const confirmRemoveRestaurant = () => {
    if (restaurantToDelete) {
      setRestaurants(prev => prev.filter(r => r.id !== restaurantToDelete))
      setRestaurantToDelete(null)
    }
  }

  const handleLocationSelect = async (location: string | { lat: number; lng: number; query?: string }) => {
    console.log('Location selected:', location);
    if (typeof location === 'string') {
        setError("Please use the location detection feature");
        return;
    }

    setIsSearching(true);
    setError(null);

    const searchParams = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
    });

    if (location.query) {
        searchParams.append('cuisine', location.query);
    }

    searchParams.append('radius', '5000');
    
    try {
        const response = await fetch(`/api/restaurants?${searchParams}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch restaurants');
        }
        
        setSearchResults(data);
    } catch (error) {
        console.error('Error searching restaurants:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch restaurants');
    } finally {
        setIsSearching(false);
    }
  };

  const addToVoting = (restaurant: SearchResult) => {
    // Convert SearchResult to Restaurant format
    const newRestaurant: Restaurant = {
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        priceRange: restaurant.priceRange,
        dietary: restaurant.dietary,
    };
    
    // Check if restaurant already exists in voting
    if (!restaurants.some(r => r.id === restaurant.id)) {
        setRestaurants(prev => [...prev, newRestaurant]);
    }
  };

  if (!groupData) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950">
      {/* Header Section with Enhanced Styling */}
      <div className="bg-slate-900/30 border-b border-slate-800/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
                {groupData.name}
              </h1>
              <Badge 
                className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"
              >
                Live Session
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <LocationInput onLocationSelect={handleLocationSelect} />
        {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500">{error}</p>
            </div>
        )}
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-4 bg-slate-900/30 border-slate-800/50 hover:bg-slate-900/50 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-lg 
                                group-hover:from-blue-500/30 group-hover:via-indigo-500/30 group-hover:to-purple-500/30 
                                transition-all duration-300">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Time Left</p>
                  <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">5:00</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Members Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-4 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Members</p>
                  <p className="text-xl font-bold text-white">{groupData.members.length}/5</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Votes Cast - Moved up */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-4 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Votes Cast</p>
                  <p className="text-xl font-bold text-white">3/5</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Group Code - with integrated share button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-4 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400">Group Code</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-white font-mono">{groupData.code}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="p-0 hover:bg-transparent"
                    >
                      <Share2 className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-12 gap-8">
            {/* Left Column - Voting Section */}
            <div className="md:col-span-8 space-y-6">
                {/* Only keep VotingSystem */}
                <VotingSystem restaurants={restaurants} onRemove={handleRemoveRestaurant} />
            </div>

            {/* Right Column - Search and Results */}
            <div className="md:col-span-4 space-y-4">
                {/* Location Search */}
                <Card className="p-4 bg-slate-900/50 border-slate-800">
                    <div className="space-y-4">
                        <LocationInput 
                            onLocationSelect={handleLocationSelect}
                            className="w-full"
                            autoDetectOnMount={true}
                        />
                        
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-500">{error}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Search Results */}
                {isSearching ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : searchResults.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-white">
                            Found {searchResults.length} restaurants
                        </h2>
                        <div className="space-y-4">
                            {searchResults.map((restaurant) => (
                                <RestaurantCard
                                    key={restaurant.id}
                                    name={restaurant.name}
                                    cuisine={restaurant.cuisine}
                                    rating={restaurant.rating}
                                    priceRange={restaurant.priceRange}
                                    distance={restaurant.distance}
                                    vicinity={restaurant.vicinity}
                                    onAddToVoting={() => addToVoting(restaurant)}
                                />
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
      </div>

      {/* Success Toast for Copy Action */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full"
          >
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!restaurantToDelete} onOpenChange={() => setRestaurantToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove Restaurant</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove this restaurant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveRestaurant}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

