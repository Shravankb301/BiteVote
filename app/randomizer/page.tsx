"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Utensils, Check } from 'lucide-react'
import RandomizerWheel from '@/components/RandomizerWheel'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [customRestaurants, setCustomRestaurants] = useState<Restaurant[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Restaurant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());

  const allRestaurants = [...restaurants, ...customRestaurants];

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

        setCurrentLocation(location);

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
    if (spinning || allRestaurants.length === 0) return;
    setSpinning(true);
    setShowCelebration(false);
    const randomIndex = Math.floor(Math.random() * allRestaurants.length);
    setSelectedRestaurant(randomIndex);
    
    setTimeout(() => {
      setSpinning(false);
      setShowCelebration(true);
    }, 3000);
  };

  const handleRestaurantSearch = async (query: string) => {
    if (!query.trim()) return;
    if (!currentLocation) {
      setError("Please select a location first");
      return;
    }
    
    setIsSearching(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        lat: currentLocation.lat.toString(),
        lng: currentLocation.lng.toString(),
        radius: '5000',
        query: query
      });

      const response = await fetch(`/api/restaurants?${searchParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch restaurants');
      }
      
      const formattedResults = data.map((restaurant: RestaurantApiResponse) => ({
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        vicinity: restaurant.vicinity,
        icon: getCuisineIcon(restaurant.cuisine)
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      setError(error instanceof Error ? error.message : 'Failed to search restaurants');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurants(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(restaurant.id)) {
        newSelected.delete(restaurant.id);
      } else {
        newSelected.add(restaurant.id);
      }
      return newSelected;
    });
  };

  const handleAddSelectedRestaurants = () => {
    const restaurantsToAdd = searchResults.filter(r => selectedRestaurants.has(r.id));
    setCustomRestaurants(prev => [...prev, ...restaurantsToAdd]);
    setShowAddDialog(false);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedRestaurants(new Set());
  };

  const renderDialogContent = () => (
    <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="text-white">Add Restaurants</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {!currentLocation ? (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-500 text-sm">
              Please select a location first to search for restaurants
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Search Restaurants</label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants..."
                className="bg-slate-800 border-slate-700 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRestaurantSearch(searchQuery);
                  }
                }}
              />
              <Button
                onClick={() => handleRestaurantSearch(searchQuery)}
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {searchResults.map((restaurant) => (
            <div
              key={restaurant.id}
              className={`p-3 rounded-lg transition-colors cursor-pointer ${
                selectedRestaurants.has(restaurant.id)
                  ? 'bg-blue-900/50 border border-blue-500/50'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              onClick={() => handleRestaurantSelect(restaurant)}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{restaurant.icon}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{restaurant.name}</h3>
                  <p className="text-sm text-slate-400">{restaurant.cuisine}</p>
                  {restaurant.vicinity && (
                    <p className="text-xs text-slate-500">{restaurant.vicinity}</p>
                  )}
                </div>
                {selectedRestaurants.has(restaurant.id) && (
                  <div className="text-blue-400">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              {selectedRestaurants.size} restaurant{selectedRestaurants.size !== 1 ? 's' : ''} selected
            </p>
            <Button
              onClick={handleAddSelectedRestaurants}
              disabled={selectedRestaurants.size === 0}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
            >
              Add Selected
            </Button>
          </div>
        )}

        {searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8 text-slate-500">
            {currentLocation 
              ? 'Search for restaurants to add them to your wheel'
              : 'Select a location to start searching for restaurants'
            }
          </div>
        )}
      </div>
    </DialogContent>
  );

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
          ) : allRestaurants.length > 0 ? (
            <motion.div 
              className="flex flex-col items-center space-y-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="relative p-8 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 shadow-xl">
                <RandomizerWheel 
                  segments={allRestaurants.length}
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
                        <div className="text-4xl">{allRestaurants[selectedRestaurant].icon}</div>
                        <h2 className="text-xl font-bold text-white">{allRestaurants[selectedRestaurant].name}</h2>
                        <p className="text-slate-300">{allRestaurants[selectedRestaurant].cuisine}</p>
                        {allRestaurants[selectedRestaurant].vicinity && (
                          <p className="text-sm text-slate-400">{allRestaurants[selectedRestaurant].vicinity}</p>
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

                <Button
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  size="lg"
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom
                </Button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setSearchResults([]);
          setSearchQuery('');
          setError(null);
        }
      }}>
        {renderDialogContent()}
      </Dialog>
    </div>
  )
}