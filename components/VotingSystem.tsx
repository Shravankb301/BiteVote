"use client"
import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { pusherClient } from '@/lib/pusher'

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  image?: string;
  dietary: string[];
  phone?: string;
  votes?: number;
  votedBy?: string[];
}

interface VotingSystemProps {
  restaurants: Restaurant[];
  onRemove: (id: string) => void;
  onVote?: (restaurantId: string) => void;
  currentUser: string;
  sessionId: string;
}

interface VoteUpdateData {
  restaurantId: string;
  votes: number;
  votedBy: string[];
}

export default function VotingSystem({ restaurants, onRemove, onVote, currentUser, sessionId }: VotingSystemProps) {
  const [isClient, setIsClient] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [votedRestaurants, setVotedRestaurants] = useState<Record<string, string[]>>({});
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [partySize, setPartySize] = useState('2');
  const [dateTime, setDateTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [hasUserVoted, setHasUserVoted] = useState(false);

  const testPhone = "+12604673696";

  // Set isClient to true once mounted
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize votes and voted state
  useEffect(() => {
    if (!isClient) return;

    const initialVotes: Record<string, number> = {};
    const initialVotedRestaurants: Record<string, string[]> = {};
    restaurants.forEach(r => {
      initialVotes[r.id] = r.votes || 0;
      initialVotedRestaurants[r.id] = r.votedBy || [];
      // Check if user has voted for any restaurant
      if (r.votedBy?.includes(currentUser)) {
        setHasUserVoted(true);
      }
    });
    setVotes(initialVotes);
    setVotedRestaurants(initialVotedRestaurants);
  }, [restaurants, currentUser, isClient]);

  // Subscribe to vote updates
  useEffect(() => {
    if (!isClient) return;

    const channel = pusherClient.subscribe(`session-${sessionId}`);
    
    channel.bind('vote-update', (data: VoteUpdateData) => {
      setVotes(prevVotes => ({
        ...prevVotes,
        [data.restaurantId]: data.votes || 0
      }));
      setVotedRestaurants(prevVoted => ({
        ...prevVoted,
        [data.restaurantId]: data.votedBy || []
      }));
    });

    return () => {
      pusherClient.unsubscribe(`session-${sessionId}`);
    };
  }, [sessionId, currentUser, isClient]);

  const handleVote = async (restaurantId: string) => {
    if (!isClient) return;

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          sessionId,
          userId: currentUser
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote');
      }

      setHasUserVoted(true);
      setVotes(prev => ({
        ...prev,
        [restaurantId]: data.votes || 0
      }));
      setVotedRestaurants(prev => ({
        ...prev,
        [restaurantId]: data.votedBy || []
      }));

      if (onVote) {
        onVote(restaurantId);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(error instanceof Error ? error.message : 'Failed to vote');
    }
  };

  const getWinningRestaurant = () => {
    if (!isClient || restaurants.length === 0) return null;
    
    return restaurants.reduce((winner, current) => {
      const currentVotes = votes[current.id] || 0;
      const winnerVotes = votes[winner?.id || ''] || 0;
      return currentVotes > winnerVotes ? current : winner;
    }, restaurants[0]);
  };

  const getTotalVotes = (restaurantId: string) => {
    return votedRestaurants[restaurantId]?.length || 0;
  };

  const getVoterNames = (restaurantId: string) => {
    return votedRestaurants[restaurantId] || [];
  };

  const handleMakeReservation = async () => {
    if (!isClient) return;
    const winner = getWinningRestaurant();
    if (!winner) return;
    
    setIsCallInProgress(true);
    try {
      const response = await fetch('/api/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantPhone: testPhone,
          partySize,
          dateTime,
          name: customerName
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert('Reservation call initiated! Please wait for confirmation.');
      setShowCallDialog(false);
    } catch (error) {
      alert('Failed to make reservation call. Please try again.');
      console.error('Reservation call error:', error);
    } finally {
      setIsCallInProgress(false);
    }
  };

  const winner = getWinningRestaurant();
  const hasVotes = Object.values(votes).some(v => v > 0);

  // Return a loading state during server-side rendering
  if (!isClient) {
    return (
      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <div>
              <h3 className="font-medium text-white">{restaurant.name}</h3>
              <div className="text-sm text-slate-400">
                Vote to see results
              </div>
            </div>
            <div className="flex gap-2">
              <Button disabled>Vote</Button>
              <Button variant="destructive" disabled>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Vote for Restaurants</h2>
        {hasUserVoted && hasVotes && winner?.phone && (
          <Button
            onClick={() => setShowCallDialog(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Winner
          </Button>
        )}
      </div>

      {restaurants.map((restaurant) => {
        const hasVoted = votedRestaurants[restaurant.id]?.includes(currentUser);
        const totalVotes = getTotalVotes(restaurant.id);
        const voters = getVoterNames(restaurant.id);
        const isWinner = winner?.id === restaurant.id && totalVotes > 0;

        return (
          <div
            key={restaurant.id}
            className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
              hasUserVoted && isWinner 
                ? 'bg-green-900/30 hover:bg-green-900/40 border border-green-500/30' 
                : 'bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">{restaurant.name}</h3>
                {hasUserVoted && isWinner && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    Leading
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-400">
                {hasUserVoted ? (
                  <>
                    <div>Total Votes: {totalVotes}</div>
                    {voters.length > 0 && (
                      <div className="text-xs text-slate-500">
                        Voted by: {voters.join(', ')}
                      </div>
                    )}
                  </>
                ) : (
                  <div>Vote to see results</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleVote(restaurant.id)}
                disabled={hasVoted}
                variant={hasVoted ? "secondary" : "default"}
                className={hasVoted ? "opacity-50" : ""}
              >
                {hasVoted ? 'Voted' : 'Vote'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => onRemove(restaurant.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        );
      })}

      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Reservation at {winner?.name}</DialogTitle>
            <DialogDescription>
              This restaurant is winning with {getTotalVotes(winner?.id || '')} votes! Fill in the details to make a reservation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="partySize">Party Size</Label>
              <Input
                id="partySize"
                type="number"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTime">Date & Time</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleMakeReservation}
              disabled={isCallInProgress || !dateTime || !customerName}
              className="w-full"
            >
              {isCallInProgress ? 'Calling...' : 'Make Reservation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

