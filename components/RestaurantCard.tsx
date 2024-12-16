"use client"

import { Star, Plus } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface RestaurantCardProps {
    name: string;
    cuisine: string;
    rating: number | null;
    priceRange: string;
    distance: number;
    vicinity: string;
    onAddToVoting?: () => void;
}

export function RestaurantCard({ name, cuisine, rating, priceRange, distance, vicinity, onAddToVoting }: RestaurantCardProps) {
    return (
        <Card className="p-4 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all duration-300">
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg text-white">{name}</h3>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-slate-200">{rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{cuisine}</span>
                    <span>•</span>
                    <span>{priceRange}</span>
                    <span>•</span>
                    <span>{(distance / 1000).toFixed(1)}km</span>
                </div>
                <p className="text-sm text-slate-500">{vicinity}</p>
                
                <Button 
                    onClick={onAddToVoting}
                    variant="outline" 
                    size="sm"
                    className="w-full mt-2 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Voting
                </Button>
            </div>
        </Card>
    );
} 