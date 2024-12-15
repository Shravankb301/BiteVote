'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Share2, Clock, ChevronRight, Crown, Filter, Search, Loader2, Check, Copy, Trash2 } from 'lucide-react'
import RestaurantList from '@/components/RestaurantList'
import VotingSystem from '@/components/VotingSystem'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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

interface Filters {
  cuisine: string;
  dietary: string;
  minRating: number;
}

interface SearchResult {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  dietary: string[];
  address?: string;
  image?: string;
}

const NATURAL_LANGUAGE_MAPPINGS = {
  // Meal types
  'breakfast': ['cafe', 'brunch', 'breakfast', 'coffee', 'bakery'],
  'lunch': ['quick bite', 'casual', 'lunch', 'sandwich', 'salad'],
  'dinner': ['restaurant', 'dining', 'dinner', 'bistro'],
  
  // Cuisines with common phrases
  'italian': ['pizza', 'pasta', 'italian'],
  'japanese': ['sushi', 'ramen', 'japanese'],
  'chinese': ['dim sum', 'noodles', 'chinese'],
  'mexican': ['tacos', 'burritos', 'mexican'],
  'indian': ['curry', 'tandoori', 'indian'],
  
  // Moods/Vibes
  'date night': ['romantic', 'intimate', 'fine dining', 'cozy'],
  'casual': ['relaxed', 'cafe', 'chill', 'informal'],
  'fancy': ['upscale', 'elegant', 'fine dining', 'luxury'],
  
  // Feelings/Cravings
  'spicy': ['indian', 'thai', 'mexican', 'hot'],
  'healthy': ['salad', 'vegan', 'organic', 'fresh'],
  'comfort food': ['burger', 'pizza', 'pasta', 'homestyle'],
  'quick': ['fast food', 'takeout', 'quick service'],
  
  // Price points
  'cheap': ['budget', 'affordable', 'inexpensive', '$'],
  'expensive': ['high-end', 'fine dining', 'upscale', '$$$'],
}

const SEARCH_SUGGESTIONS = [
  "I'm in the mood for something spicy 🌶️",
  "Need a romantic spot for date night 💝",
  "Craving comfort food right now 🍕",
  "Looking for healthy options 🥗",
  "Quick lunch spots nearby ⚡",
  "Fancy dinner recommendations 🎩",
]

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
      dietary: ['vegetarian', 'gluten-free'],
    },
    {
      id: '2',
      name: 'Sushi Wave',
      cuisine: 'Japanese',
      rating: 4.8,
      priceRange: '$$$',
      dietary: ['gluten-free', 'halal'],
    },
    {
      id: '3',
      name: 'Burger Joint',
      cuisine: 'American',
      rating: 4.2,
      priceRange: '$',
      dietary: ['vegetarian', 'vegan'],
    },
  ])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    cuisine: 'all',
    dietary: 'all',
    minRating: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchSuggestion, setSearchSuggestion] = useState('')
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(null)

  const cuisineTypes = ['All', 'Italian', 'Japanese', 'American', 'Mexican', 'Chinese', 'Indian', 'Thai']
  const dietaryOptions = [
    'All',
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Halal',
    'Kosher',
    'Dairy-Free',
    'Nut-Free'
  ]

  const filteredRestaurants = restaurants.filter(restaurant => {
    return (
      (filters.cuisine === 'all' || restaurant.cuisine.toLowerCase() === filters.cuisine) &&
      (filters.dietary === 'all' || restaurant.dietary.includes(filters.dietary)) &&
      restaurant.rating >= filters.minRating
    )
  })

  const processNaturalLanguageQuery = (query: string) => {
    const queryLower = query.toLowerCase()
    let searchTerms = new Set<string>()

    // Check for direct matches in our mappings
    Object.entries(NATURAL_LANGUAGE_MAPPINGS).forEach(([key, values]) => {
      if (queryLower.includes(key)) {
        values.forEach(value => searchTerms.add(value))
      }
    })

    // Add the original query terms
    queryLower.split(' ').forEach(term => searchTerms.add(term))

    return Array.from(searchTerms)
  }

  const searchRestaurants = async (query: string) => {
    setIsSearching(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const searchTerms = processNaturalLanguageQuery(query)
      
      // Mock results with enhanced matching
      const results: SearchResult[] = [
        {
          id: 'mock1',
          name: 'Pizza Express',
          cuisine: 'Italian',
          rating: 4.5,
          priceRange: '$$',
          dietary: ['vegetarian'],
          address: '123 Main St',
          tags: ['comfort food', 'casual', 'dinner']
        },
        {
          id: 'mock2',
          name: 'Sushi Bar',
          cuisine: 'Japanese',
          rating: 4.8,
          priceRange: '$$$',
          dietary: ['gluten-free'],
          address: '456 Oak Ave',
          tags: ['fancy', 'date', 'dinner']
        },
        // Add more mock restaurants...
      ].filter(r => 
        searchTerms.some(term => 
          r.name.toLowerCase().includes(term) ||
          r.cuisine.toLowerCase().includes(term) ||
          r.tags.some(tag => tag.includes(term))
        )
      )
      
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) {
        searchRestaurants(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

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
            {/* Search and Filters Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-4 bg-slate-900/50 border-slate-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="What do you want to eat?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-900/30 border-slate-700/50 text-white 
                                 focus:border-blue-500/50 focus:ring-purple-500/20 transition-all duration-300
                                 hover:bg-slate-900/50"
                    />
                  </div>
                </Card>
              </motion.div>

              {/* Quick Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="p-4 bg-slate-900/50 border-slate-800">
                  <div className="flex items-center gap-2">
                    <Select
                      value={filters.cuisine}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, cuisine: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Cuisine" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {cuisineTypes.map((type) => (
                          <SelectItem 
                            key={type.toLowerCase()} 
                            value={type.toLowerCase()}
                            className="text-white hover:bg-slate-700"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`border-slate-700/50 hover:border-blue-500/50 transition-all duration-300
                                  ${showFilters ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 text-blue-400' : ''}`}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-6 bg-slate-900/50 border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-white">Advanced Filters</h2>
                      <Badge variant="outline" className="text-slate-400">
                        {filteredRestaurants.length} results
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Dietary Preferences */}
                      <div className="space-y-2">
                        <Label className="text-white">Dietary Preferences</Label>
                        <Select
                          value={filters.dietary}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, dietary: value }))}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select dietary" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {dietaryOptions.map((option) => (
                              <SelectItem 
                                key={option.toLowerCase()} 
                                value={option.toLowerCase()}
                                className="text-white hover:bg-slate-700 flex items-center gap-2"
                              >
                                {option} {' '}
                                {option === 'All' && '🍽️'}
                                {option === 'Vegetarian' && '🥗'}
                                {option === 'Vegan' && '🌱'}
                                {option === 'Gluten-Free' && '🌾'}
                                {option === 'Halal' && '🥩'}
                                {option === 'Kosher' && '✡️'}
                                {option === 'Dairy-Free' && '🥛'}
                                {option === 'Nut-Free' && '🥜'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rating Filter */}
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <Label className="text-white">Minimum Rating</Label>
                          <span className="text-sm text-slate-400">{filters.minRating} ⭐</span>
                        </div>
                        <Slider
                          value={[filters.minRating]}
                          onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                          max={5}
                          step={0.5}
                          className="py-4"
                        />
                      </div>

                      {/* Reset Button */}
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          className="w-full border-slate-700 hover:border-blue-500/50 transition-colors"
                          onClick={() => setFilters({ cuisine: 'all', dietary: 'all', minRating: 0 })}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voting Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 bg-slate-900/30 border-slate-800/50 hover:bg-slate-900/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
                    Cast Your Vote
                  </h2>
                  <Badge className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border-blue-500/20">
                    Voting Open
                  </Badge>
                </div>
                <VotingSystem 
                  restaurants={filteredRestaurants} 
                  onRemoveRestaurant={handleRemoveRestaurant}
                />
              </Card>
            </motion.div>

            {/* Members List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6 bg-slate-900/50 border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-4">Group Members</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {groupData.members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50"
                    >
                      {index === 0 ? (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="text-slate-300">{member}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Search Results */}
          <div className="md:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 bg-slate-900/50 border-slate-800">
                <div className="space-y-6">
                  {/* Search Suggestions */}
                  {!searchQuery && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-slate-400">Popular Searches</h3>
                      <div className="flex flex-wrap gap-2">
                        {SEARCH_SUGGESTIONS.map((suggestion, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="px-3 py-1.5 text-sm bg-slate-800/50 hover:bg-slate-800 
                                   text-slate-400 hover:text-white rounded-full transition-colors
                                   border border-slate-700 hover:border-slate-600"
                            onClick={() => setSearchQuery(suggestion)}
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchQuery && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-400">
                          Search Results
                        </h3>
                        {!isSearching && (
                          <Badge variant="outline" className="text-slate-400">
                            {searchResults.length} found
                          </Badge>
                        )}
                      </div>

                      {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                          <p className="text-slate-400 text-sm">Finding the perfect spot...</p>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                          <p className="text-slate-400">No restaurants found</p>
                          <p className="text-sm text-slate-500">Try different keywords or browse suggestions</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {searchResults.map((result) => (
                            <motion.div
                              key={result.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 rounded-lg bg-slate-900/30 hover:bg-gradient-to-r 
                                       hover:from-slate-900/80 hover:via-indigo-900/50 hover:to-slate-900/80 
                                       cursor-pointer transition-all duration-300 group border border-transparent 
                                       hover:border-blue-500/20"
                              onClick={() => {
                                setRestaurants(prev => [...prev, result])
                                setSearchQuery('')
                                setSearchResults([])
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                    {result.name}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span>{result.cuisine}</span>
                                    <span>•</span>
                                    <span>{result.priceRange}</span>
                                    <span>•</span>
                                    <span className="text-yellow-400">
                                      {'⭐'.repeat(Math.floor(result.rating))}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {result.dietary.map((diet, index) => (
                                      <Badge 
                                        key={index}
                                        variant="secondary" 
                                        className="text-xs bg-slate-700/50"
                                      >
                                        {diet}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-sm text-slate-500 mt-1">{result.address}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 hover:bg-blue-500/10 
                                           hover:text-blue-400 transition-all duration-200"
                                >
                                  Add
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
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

