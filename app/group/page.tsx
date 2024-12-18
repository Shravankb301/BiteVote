"use client"

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Share2, Loader2, Check } from 'lucide-react'
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
import { useSearchParams } from 'next/navigation';
import { Toast } from "@/components/ui/toast";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  dietary: string[];
  image?: string;
  phone?: string;
  votes?: number;
  votedBy?: string[];
}

interface GroupData {
  name: string;
  members: string[];
  code: string;
  restaurants?: Restaurant[];
  lastUpdated: string;
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
  phone?: string;
}

function GroupContent() {
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [copied, setCopied] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchParams = useSearchParams();
  const sharedCode = searchParams.get('code');
  const [isClient, setIsClient] = useState(false);
  const [joinNotification, setJoinNotification] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const data = localStorage.getItem('group')
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setGroupData(parsedData);
        setRestaurants(parsedData.restaurants || []);
        
        // Initialize session
        fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: parsedData.code,
                groupData: parsedData
            })
        }).catch(error => console.error('Error initializing session:', error));
      } catch (error) {
        console.error('Error parsing group data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient || !sharedCode || !groupData) return;

    const joinSharedSession = async () => {
      try {
        const response = await fetch(`/api/sessions?code=${sharedCode}`);
        const data = await response.json();
        
        if (response.ok && data && groupData.members?.[0]) {
          // Check if this is a new member
          const isNewMember = !data.members?.includes(groupData.members[0]);
          
          if (isNewMember) {
            // Add new member to the session
            const updatedData = {
              ...data,
              members: [...(data.members || []), groupData.members[0]]
            };
            
            setGroupData(updatedData);
            localStorage.setItem('group', JSON.stringify(updatedData));

            // Show notification
            setJoinNotification(`${groupData.members[0]} joined the session`);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);

            // Update session with new member
            await fetch('/api/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: sharedCode,
                groupData: updatedData
              })
            });
          }
        }
      } catch (error) {
        console.error('Error joining session:', error);
      }
    };

    joinSharedSession();
  }, [sharedCode, groupData, isClient]);

  const handleCopyLink = async () => {
    if (groupData) {
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: groupData.code,
                groupData: {
                    ...groupData,
                    restaurants,
                    lastUpdated: new Date().toISOString()
                }
            })
        });

        const shareUrl = `${window.location.origin}/group?code=${groupData.code}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  }

  const handleRemoveRestaurant = (restaurantId: string) => {
    setRestaurantToDelete(restaurantId)
    updateSession()
  }

  const confirmRemoveRestaurant = async () => {
    if (restaurantToDelete) {
        const newRestaurants = restaurants.filter(r => r.id !== restaurantToDelete);
        setRestaurants(newRestaurants);
        setRestaurantToDelete(null);
        
        // Update session after removing restaurant
        if (groupData) {
            try {
                await fetch('/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: groupData.code,
                        groupData: {
                            ...groupData,
                            restaurants: newRestaurants,
                            lastUpdated: new Date().toISOString()
                        }
                    })
                });
            } catch (error) {
                console.error('Error updating session:', error);
            }
        }
    }
  };

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

  const addToVoting = async (restaurant: SearchResult) => {
    // Only proceed if not already in voting
    if (restaurants.some(r => r.id === restaurant.id)) {
        return;
    }

    const newRestaurant: Restaurant = {
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        priceRange: restaurant.priceRange,
        dietary: restaurant.dietary,
        phone: restaurant.phone,
    };

    // Update local state
    const updatedRestaurants = [...restaurants, newRestaurant];
    setRestaurants(updatedRestaurants);

    // Update session
    if (groupData) {
        try {
            const timestamp = new Date().toISOString();
            await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: groupData.code,
                    groupData: {
                        ...groupData,
                        restaurants: updatedRestaurants,
                        lastUpdated: timestamp
                    }
                })
            });
        } catch (error) {
            console.error('Error updating session:', error);
        }
    }
  };

  const updateSession = async () => {
    if (!groupData) return;
    
    const timestamp = new Date().toISOString();
    try {
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: groupData.code,
                groupData: {
                    ...groupData,
                    restaurants,
                    lastUpdated: timestamp
                }
            })
        });
    } catch (error) {
        console.error('Error updating session:', error);
    }
  };

  useEffect(() => {
    if (!groupData?.code) return;

    const syncInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/sessions?code=${groupData.code}`);
            const data = await response.json();
            
            if (response.ok && data.lastUpdated && 
                (!groupData.lastUpdated || new Date(data.lastUpdated) > new Date(groupData.lastUpdated))) {
                
                // Check for new members with null safety
                const currentMembers = groupData.members || [];
                const newMembers = (data.members || []).filter((m: string) => !currentMembers.includes(m));
                
                if (newMembers.length > 0) {
                    setJoinNotification(`${newMembers[0]} joined the session`);
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 3000);
                }

                // Ensure data has required properties with defaults
                const updatedData = {
                    ...data,
                    members: data.members || [],
                    restaurants: data.restaurants || [],
                    lastUpdated: data.lastUpdated
                };

                setGroupData(updatedData);
                setRestaurants(updatedData.restaurants);
                localStorage.setItem('group', JSON.stringify(updatedData));
            }
        } catch (error) {
            console.error('Error syncing session:', error);
        }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [groupData?.code, groupData?.lastUpdated, groupData?.members]);

  const handleVote = async (restaurantId: string) => {
    if (!groupData) return;

    // Get current restaurant votes
    const currentRestaurants = [...restaurants];
    const voterName = groupData.members[0];

    // Remove any existing votes by this user
    currentRestaurants.forEach(r => {
        if (r.votedBy) {
            r.votedBy = r.votedBy.filter(voter => voter !== voterName);
            r.votes = (r.votedBy || []).length;
        }
    });

    // Add new vote
    const restaurantToUpdate = currentRestaurants.find(r => r.id === restaurantId);
    if (restaurantToUpdate) {
        restaurantToUpdate.votedBy = [...(restaurantToUpdate.votedBy || []), voterName];
        restaurantToUpdate.votes = restaurantToUpdate.votedBy.length;
    }

    setRestaurants(currentRestaurants);

    // Update session with new votes
    try {
        const timestamp = new Date().toISOString();
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: groupData.code,
                groupData: {
                    ...groupData,
                    restaurants: currentRestaurants,
                    lastUpdated: timestamp
                }
            })
        });
    } catch (error) {
        console.error('Error updating votes:', error);
    }
  };

  if (!isClient) {
    return null; // Return null on server-side and during hydration
  }

  if (!groupData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 page-no-scroll">
      {/* Header Section with Enhanced Styling */}
      <div className="bg-slate-900/30 border-b border-slate-800/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
                {groupData.name}
              </h1>
              <Badge 
                className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse relative pl-6"
              >
                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"></span>
                Live Session
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 overflow-hidden">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                            <p className="text-xl font-bold text-white">
                                {groupData.members.length}/5
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Votes Cast */}
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

            {/* Group Code */}
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
                                    className="p-0 hover:bg-transparent relative"
                                >
                                    <Share2 className={`w-4 h-4 transition-colors ${
                                        copied ? 'text-green-400' : 'text-slate-400 hover:text-blue-400'
                                    }`} />
                                    {copied && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-green-400"
                                        >
                                            Link copied!
                                        </motion.div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-12 gap-8 overflow-hidden">
            {/* Left Column - Voting Section */}
            <div className="md:col-span-7 space-y-6">
                <VotingSystem 
                  restaurants={restaurants} 
                  onRemove={handleRemoveRestaurant}
                  onVote={handleVote}
                  currentUser={groupData.members[0]}
                  sessionId={groupData.code}
                />
            </div>

            {/* Right Column - Search and Results */}
            <div className="md:col-span-5 space-y-4">
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
                        <div className="h-[calc(100vh-400px)] overflow-y-auto space-y-4 no-scrollbar">
                            {searchResults.map((restaurant) => (
                                <RestaurantCard
                                    key={restaurant.id}
                                    name={restaurant.name}
                                    cuisine={restaurant.cuisine}
                                    rating={restaurant.rating}
                                    priceRange={restaurant.priceRange}
                                    distance={restaurant.distance}
                                    vicinity={restaurant.vicinity}
                                    phone={restaurant.phone}
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

      <Toast 
        message={joinNotification}
        isVisible={showNotification}
      />
    </div>
  )
}

export default function GroupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GroupContent />
    </Suspense>
  )
}

