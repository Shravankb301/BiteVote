"use client"
import { Suspense, useCallback } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pusherClient } from '@/lib/pusher'
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

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
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [sessionDataToJoin, setSessionDataToJoin] = useState<GroupData | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const [testUser] = useState<string | false>(() => {
    if (typeof window === 'undefined' || !window.location.search.includes('test=true')) {
      return false;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    if (userParam === 'alice' || userParam === 'bob') {
      return userParam;
    }
    return `TestUser_${Math.random().toString(36).slice(2, 7)}`;
  });

  useEffect(() => {
    setIsClient(true);
    const initializeGroup = async () => {
      setIsLoading(true);
      const isTestMode = window.location.search.includes('test=true');

      // Load current user from localStorage
      const storedUserName = localStorage.getItem('currentUser');
      if (storedUserName) {
        setCurrentUserName(storedUserName);
      }

      if (isTestMode) {
        const testSessionId = 'test_session_123';
        const testGroupData = {
          name: 'Test Group',
          members: [testUser as string],
          code: testSessionId,
          restaurants: [],
          lastUpdated: new Date().toISOString()
        };

        try {
          console.log('Initializing test mode for user:', testUser);
          
          // Only clean up if this is Alice (first test user)
          if (testUser === 'alice') {
            console.log('First test user (Alice) - cleaning up previous test data...');
            const cleanupResponse = await fetch('/api/votes/cleanup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: testSessionId
              })
            });
            
            if (!cleanupResponse.ok) {
              console.error('Cleanup failed:', await cleanupResponse.json());
            }

            // Clear local storage for test mode
            localStorage.removeItem('group');
          }
          
          console.log('Checking for existing test session...');
          const response = await fetch(`/api/sessions?code=${testSessionId}`);
          const existingSession = await response.json();
          
          if (response.ok && existingSession && !response.status.toString().startsWith('4')) {
            console.log('Found existing session:', existingSession);
            
            // For test users, always join if not already in members
            if (!existingSession.members?.includes(testUser)) {
              console.log('Joining existing session as:', testUser);
              const updatedSession = {
                ...existingSession,
                members: [...(existingSession.members || []), testUser as string].filter(Boolean),
                lastUpdated: new Date().toISOString()
              };
              
              await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: testSessionId,
                  groupData: updatedSession
                })
              });
              setGroupData(updatedSession);
              setRestaurants(existingSession.restaurants || []);
            } else {
              console.log('User already in session:', testUser);
              // Get fresh vote data for this user
              const votes = await Promise.all((existingSession.restaurants || []).map(async (r: Restaurant) => {
                try {
                  const voteResponse = await fetch(`/api/votes?restaurantId=${r.id}&sessionId=${testSessionId}`);
                  const voteData = await voteResponse.json();
                  return {
                    ...r,
                    votes: voteData.votes,
                    votedBy: voteData.votedBy
                  };
                } catch (error) {
                  console.error('Error fetching vote data:', error);
                  return r;
                }
              }));
              setGroupData(existingSession);
              setRestaurants(votes);
            }
          } else {
            // Create new session for first test user
            console.log('Creating new test session as:', testUser);
            const createResponse = await fetch('/api/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: testGroupData.code,
                groupData: testGroupData
              })
            });
            
            if (!createResponse.ok) {
              throw new Error('Failed to create test session');
            }
            
            setGroupData(testGroupData);
            setRestaurants([]);
          }
        } catch (error) {
          console.error('Error with test session:', error);
          setError('Failed to initialize test session. Please try again.');
          setGroupData(null);
          setRestaurants([]);
        }
        setIsLoading(false);
        return;
      }

      // Check for shared code in URL
      const sharedCode = searchParams.get('code');
      
      // If there's a shared code, try to fetch the session first
      if (sharedCode) {
        try {
          const response = await fetch(`/api/sessions?code=${sharedCode}`);
          const sessionData = await response.json();
          
          if (response.ok && sessionData) {
            // Check if user already has group data
            const existingData = localStorage.getItem('group');
            const existingGroupData = existingData ? JSON.parse(existingData) : null;
            
            // If no existing data or different group, show join dialog
            if (!existingGroupData || existingGroupData.code !== sharedCode) {
              setSessionDataToJoin(sessionData);
              setIsLoading(false);
              return;
            }
            
            // Initialize with existing session data
            setGroupData(existingGroupData);
            setRestaurants(sessionData.restaurants || []);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching session:', error);
          toast({
            title: "Error",
            description: "Failed to load group session. Please try again.",
            variant: "destructive"
          });
        }
      }
      
      // If no shared code or session fetch failed, try local storage
      const data = localStorage.getItem('group');
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          setGroupData(parsedData);
          setRestaurants(parsedData.restaurants || []);
          
          // Initialize session
          await fetch('/api/sessions', {
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
      setIsLoading(false);
    };

    initializeGroup();
  }, [searchParams, testUser, toast]);

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
    setRestaurantToDelete(restaurantId);
  }

  const confirmRemoveRestaurant = async () => {
    if (!restaurantToDelete || !groupData) return;

    try {
        const newRestaurants = restaurants.filter(r => r.id !== restaurantToDelete);
        
        // Update local state and localStorage atomically
        const updatedGroupData = {
            ...groupData,
            restaurants: newRestaurants,
            lastUpdated: new Date().toISOString()
        };

        setRestaurants(newRestaurants);
        setRestaurantToDelete(null);
        setGroupData(updatedGroupData);
        localStorage.setItem('group', JSON.stringify(updatedGroupData));
        
        // Update session
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: groupData.code,
                groupData: updatedGroupData
            })
        });

        // Show success message
        const removedRestaurant = restaurants.find(r => r.id === restaurantToDelete);
        toast({
            title: "Restaurant Removed",
            description: `${removedRestaurant?.name} has been removed from voting.`
        });

    } catch (error) {
        console.error('Error removing restaurant:', error);
        toast({
            title: "Error",
            description: "Failed to remove restaurant. Please try again.",
            variant: "destructive"
        });
        
        // Revert local state on error by reloading from localStorage
        const storedGroup = localStorage.getItem('group');
        if (storedGroup) {
            try {
                const parsedGroup = JSON.parse(storedGroup);
                setGroupData(parsedGroup);
                setRestaurants(parsedGroup.restaurants || []);
            } catch (e) {
                console.error('Error parsing stored group data:', e);
            }
        }
    }
  };

  const handleLocationSelect = async (location: string | { lat: number; lng: number; query?: string }) => {
    console.log('Location selected:', location);
    if (typeof location === 'string') {
        toast({
            title: "Location Error",
            description: "Please use the location detection feature",
            variant: "destructive"
        });
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
        
        if (data.length === 0) {
            toast({
                title: "No Results",
                description: "No restaurants found in your area. Try expanding your search.",
            });
        } else {
            toast({
                title: "Restaurants Found",
                description: `Found ${data.length} restaurants near you.`,
            });
        }
    } catch (error) {
        console.error('Error searching restaurants:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch restaurants';
        setError(errorMessage);
        toast({
            title: "Search Error",
            description: errorMessage,
            variant: "destructive"
        });
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

    // Update session and trigger real-time update
    if (groupData) {
        try {
            const timestamp = new Date().toISOString();
            const updatedGroupData = {
                ...groupData,
                restaurants: updatedRestaurants,
                lastUpdated: timestamp
            };

            await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: groupData.code,
                    groupData: updatedGroupData
                })
            });

            // Trigger Pusher event for real-time update
            await fetch('/api/pusher/trigger-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: groupData.code,
                    restaurants: updatedRestaurants
                })
            });
        } catch (error) {
            console.error('Error updating session:', error);
        }
    }
  };

  useEffect(() => {
    if (!groupData?.code) return;

    let isMounted = true;

    const syncSession = async () => {
        if (!groupData) return; // Early return if no groupData

        try {
            const response = await fetch(`/api/sessions?code=${groupData.code}`);
            
            // Check if response is ok and is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                console.error('Non-JSON response received:', await response.text());
                return;
            }

            const data = await response.json();
            
            if (!isMounted) return;

            if (response.ok && data.lastUpdated && 
                (!groupData.lastUpdated || new Date(data.lastUpdated) > new Date(groupData.lastUpdated))) {
                
                // Check for new members with null safety
                const currentMembers = groupData.members || [];
                const newMembers = (data.members || []).filter((m: string) => !currentMembers.includes(m));
                
                if (newMembers.length > 0) {
                  toast({
                    title: "New Member",
                    description: `${newMembers[0]} joined the session`
                  });
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
            } else if (!response.ok) {
                console.error('Error syncing session:', data.error || 'Unknown error');
                if (response.status === 404) {
                    // Handle session not found
                    console.log('Session not found, creating new one...');
                    await fetch('/api/sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code: groupData.code,
                            groupData: {
                                ...groupData,
                                lastUpdated: new Date().toISOString()
                            }
                        })
                    });
                }
            }
        } catch (error) {
            console.error('Error syncing session:', error);
            // Don't throw the error, just log it and continue
            // This prevents the app from crashing on temporary network issues
        }
    };

    // Initial sync
    syncSession();

    // Set up interval for periodic sync
    const syncInterval = setInterval(syncSession, 2000);

    // Subscribe to Pusher channel for real-time updates
    const channel = pusherClient.subscribe(`session-${groupData.code}`);
    
    // Listen for restaurant updates
    channel.bind('restaurant-update', (data: { restaurants: Restaurant[] }) => {
        if (!isMounted) return;
        console.log('Received restaurant update:', data);
        setRestaurants(data.restaurants);
        setGroupData(prevData => {
            if (!prevData) return null;
            const updatedData = {
                ...prevData,
                restaurants: data.restaurants,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('group', JSON.stringify(updatedData));
            return updatedData;
        });
    });

    // Listen for vote updates
    channel.bind('vote-update', (data: { restaurantId: string; votes: number; votedBy: string[] }) => {
        if (!isMounted) return;
        console.log('Received vote update:', data);
        setRestaurants(prevRestaurants => {
            const updatedRestaurants = prevRestaurants.map(restaurant => 
                restaurant.id === data.restaurantId
                    ? { ...restaurant, votes: data.votes, votedBy: data.votedBy }
                    : restaurant
            );
            
            // Update group data with the new restaurants
            setGroupData(prevData => {
                if (!prevData) return null;
                const updatedData = {
                    ...prevData,
                    restaurants: updatedRestaurants,
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem('group', JSON.stringify(updatedData));
                return updatedData;
            });
            
            return updatedRestaurants;
        });
    });

    return () => {
        console.log('Cleaning up Pusher subscription and sync interval');
        isMounted = false;
        clearInterval(syncInterval);
        pusherClient.unsubscribe(`session-${groupData.code}`);
    };
  }, [groupData, toast]);

  const handleVote = async (restaurantId: string) => {
    if (!groupData) return;

    // Use the stored current user name or test user
    const voterName = testUser || currentUserName;
    
    if (!voterName) {
      toast({
        title: "Error",
        description: "Could not determine user identity. Please try rejoining the session.",
        variant: "destructive"
      });
      return;
    }

    try {
        // Call the votes API
        const response = await fetch('/api/votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurantId,
                sessionId: groupData.code,
                userId: voterName
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            // Handle specific error cases
            if (data.error === 'Already voted in this session') {
                console.info('Vote prevented:', {
                    reason: 'User already voted',
                    user: voterName,
                    votedRestaurantId: data.votedRestaurantId
                });
                
                const votedRestaurantId = data.votedRestaurantId;
                const votedRestaurant = restaurants.find(r => r.id === votedRestaurantId);
                toast({
                    title: "Already Voted",
                    description: votedRestaurant 
                        ? `You have already voted for ${votedRestaurant.name} in this session.`
                        : "You have already voted in this session.",
                    variant: "destructive"
                });
            } else {
                console.error('Vote error:', {
                    error: data.error,
                    status: response.status,
                    user: voterName,
                    restaurantId
                });
                
                toast({
                    title: "Error",
                    description: data.error || "Failed to record your vote. Please try again.",
                    variant: "destructive"
                });
            }
            return;
        }

        // Update local state with the new vote data
        const updatedRestaurants = restaurants.map(restaurant => {
            if (restaurant.id === restaurantId) {
                return {
                    ...restaurant,
                    votes: data.votes,
                    votedBy: data.votedBy
                };
            }
            return restaurant;
        });

        setRestaurants(updatedRestaurants);

        // Update group data
        const updatedGroupData = {
            ...groupData,
            restaurants: updatedRestaurants,
            lastUpdated: new Date().toISOString()
        };
        setGroupData(updatedGroupData);
        localStorage.setItem('group', JSON.stringify(updatedGroupData));

        // Show success message
        const votedRestaurant = restaurants.find(r => r.id === restaurantId);
        console.info('Vote recorded:', {
            user: voterName,
            restaurant: votedRestaurant?.name,
            totalVotes: data.votes
        });
        
        toast({
            title: "Vote Recorded",
            description: `Your vote for ${votedRestaurant?.name} has been recorded.`,
        });

    } catch (error) {
        console.error('Vote error:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            user: voterName,
            restaurantId
        });
        
        toast({
            title: "Error",
            description: "Failed to record your vote. Please try again.",
            variant: "destructive"
        });
    }
  };

  // Show notification using toast instead of custom Toast component
  const showJoinNotification = (message: string) => {
    toast({
      title: "New Member",
      description: message,
    });
  };

  // Update the handleJoinGroup function
  const handleJoinGroup = async () => {
    if (!sessionDataToJoin || !newUserName.trim()) return;

    const userName = newUserName.trim();
    
    // Store the user name in localStorage
    localStorage.setItem('currentUser', userName);
    setCurrentUserName(userName);

    // Add new member to the session
    const updatedData = {
      ...sessionDataToJoin,
      members: [...(sessionDataToJoin.members || []), userName]
    };
    
    setGroupData(updatedData);
    setRestaurants(sessionDataToJoin.restaurants || []);
    localStorage.setItem('group', JSON.stringify(updatedData));
    setShowNameDialog(false);

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionDataToJoin.code,
          groupData: updatedData
        })
      });

      // Show notification using toast
      showJoinNotification(`${userName} joined the session`);
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Add this function to calculate total votes
  const getTotalVotes = useCallback(() => {
    console.log('Calculating total votes for restaurants:', restaurants);
    const total = restaurants.reduce((total, restaurant) => {
      const votes = restaurant.votedBy?.length || 0;
      console.log(`Restaurant ${restaurant.name}: ${votes} votes`);
      return total + votes;
    }, 0);
    console.log('Total votes:', total);
    return total;
  }, [restaurants]);

  const handleEndSession = async () => {
    if (!groupData?.code) {
      console.error('No session code available');
      return;
    }

    try {
      // Call cleanup endpoint
      const response = await fetch('/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: groupData.code
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cleanup session');
      }

      // Clear local storage
      localStorage.removeItem('group');

      // Show success toast
      toast({
        title: "Success",
        description: "Session ended successfully.",
      });

      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Failed to end session:', error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Show name dialog if we have session data to join but no group data
  if (sessionDataToJoin && !groupData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950">
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Join {sessionDataToJoin.name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter your name to join the group session.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-white">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleJoinGroup}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                disabled={!newUserName.trim()}
              >
                Join Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
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
                                {groupData.members.length} Active
                            </p>
                            <div className="text-xs text-slate-500">
                                {groupData.members.join(', ')}
                            </div>
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
                            <p className="text-xl font-bold text-white">
                                {getTotalVotes()} Total
                            </p>
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
                  currentUser={testUser || currentUserName}
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

      {/* End Session Button */}
      <div className="container mx-auto px-4 pb-8">
        <Button 
          variant="destructive" 
          onClick={handleEndSession}
          className="w-full"
        >
          End Session
        </Button>
      </div>

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

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Join Group</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your name to join the group session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleJoinGroup}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              disabled={!newUserName.trim()}
            >
              Join Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast for notifications */}
      <Toaster />
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

