"use client"

import { useState } from 'react';
import { Star, Plus, Phone } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface RestaurantCardProps {
    name: string;
    cuisine: string;
    rating: number | null;
    priceRange: string;
    distance: number;
    vicinity: string;
    phone?: string;
    onAddToVoting: () => void;
}

export function RestaurantCard({ 
    name, 
    cuisine, 
    rating, 
    priceRange, 
    distance,
    vicinity,
    phone,
    onAddToVoting 
}: RestaurantCardProps) {
    const [showCallDialog, setShowCallDialog] = useState(false);
    const [partySize, setPartySize] = useState('2');
    const [dateTime, setDateTime] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isCallInProgress, setIsCallInProgress] = useState(false);

    const testPhone = "+12604673696"; // Replace with your actual phone number

    const handleMakeReservation = async () => {
        if (!phone) return;
        
        setIsCallInProgress(true);
        try {
            const response = await fetch('/api/call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    restaurantPhone: phone,
                    partySize,
                    dateTime,
                    name: customerName
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Show success message
            alert('Reservation call initiated! Please wait for confirmation.');
            setShowCallDialog(false);
        } catch (error) {
            alert('Failed to make reservation call. Please try again.');
            console.error('Reservation call error:', error);
        } finally {
            setIsCallInProgress(false);
        }
    };

    return (
        <>
            <Card className="p-4 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all duration-300">
                <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg text-white">{name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                <span>{cuisine}</span>
                                <span>•</span>
                                <span>{priceRange}</span>
                                <span>•</span>
                                <span>{(distance / 1000).toFixed(1)}km</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{vicinity}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm text-slate-200">{rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <Button 
                                onClick={onAddToVoting} 
                                className="whitespace-nowrap px-4 py-2 text-sm font-medium"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add to Voting
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Make a Reservation at {name}</DialogTitle>
                        <DialogDescription>
                            Fill in the details and we'll call the restaurant for you.
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
        </>
    );
} 