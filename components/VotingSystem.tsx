"use client"
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Phone } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
}

interface VotingSystemProps {
  restaurants: Restaurant[];
  onRemove: (restaurantId: string) => void;
}

export default function VotingSystem({ restaurants, onRemove }: VotingSystemProps) {
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [partySize, setPartySize] = useState('2');
  const [dateTime, setDateTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isCallInProgress, setIsCallInProgress] = useState(false);

  const testPhone = "+12604673696"; // Your test phone number

  const handleVote = (restaurantId: string) => {
    setVotes(prev => ({
      ...prev,
      [restaurantId]: (prev[restaurantId] || 0) + 1
    }));
  };

  const getWinningRestaurant = () => {
    return restaurants.reduce((winner, current) => {
      const currentVotes = votes[current.id] || 0;
      const winnerVotes = votes[winner?.id || ''] || 0;
      return currentVotes > winnerVotes ? current : winner;
    }, restaurants[0]);
  };

  const handleMakeReservation = async () => {
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
                restaurantPhone: testPhone, // Use test phone instead of winner.phone
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
  const hasVotes = Object.keys(votes).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Vote for Restaurants</h2>
        {hasVotes && winner?.phone && (
          <Button
            onClick={() => setShowCallDialog(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Winner
          </Button>
        )}
      </div>

      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <div>
            <h3 className="font-medium text-white">{restaurant.name}</h3>
            <div className="text-sm text-slate-400">
              Votes: {votes[restaurant.id] || 0}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleVote(restaurant.id)}>
              Vote
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onRemove(restaurant.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Reservation at {winner?.name}</DialogTitle>
            <DialogDescription>
              This restaurant won the vote! Fill in the details to make a reservation.
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
  )
}

