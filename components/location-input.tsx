"use client";

import { useState, useEffect } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LocationInputProps {
    onLocationSelect: (location: string | { lat: number; lng: number; query?: string }) => void;
    className?: string;
    autoDetectOnMount?: boolean;
}

export function LocationInput({ onLocationSelect, className, autoDetectOnMount = false }: LocationInputProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    useEffect(() => {
        if (autoDetectOnMount) {
            setShowLocationPrompt(true);
        }
    }, [autoDetectOnMount]);

    const getCurrentLocation = () => {
        setIsLoading(true);
        setError(null);
        setShowLocationPrompt(false);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setIsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                try {
                    const coords = {
                        lat: Number(position.coords.latitude),
                        lng: Number(position.coords.longitude)
                    };
                    console.log('Browser location:', coords);
                    setCurrentLocation(coords);
                    onLocationSelect(coords);
                } catch (error) {
                    console.error('Error processing coordinates:', error);
                    setError("Error processing location data");
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = "Unable to retrieve your location. ";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Location permission denied.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Location request timed out.";
                        break;
                    default:
                        errorMessage += "Please try again.";
                }
                setError(errorMessage);
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLocation) {
            setError("Please enable location services first");
            setShowLocationPrompt(true);
            return;
        }
        
        if (searchQuery.trim()) {
            onLocationSelect({ ...currentLocation, query: searchQuery.trim() });
        }
    };

    return (
        <>
            <div className={cn("space-y-2", className)}>
                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearchSubmit} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder={currentLocation ? "Search for restaurants..." : "Enable location to search"}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setError(null);
                                }}
                                className="pl-10 bg-slate-900/30 border-slate-700/50 text-white 
                                         focus:border-blue-500/50 focus:ring-purple-500/20 transition-all duration-300
                                         hover:bg-slate-900/50"
                                disabled={isLoading || !currentLocation}
                            />
                        </div>
                    </form>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={getCurrentLocation}
                        disabled={isLoading}
                        className="shrink-0 bg-slate-900/30 border-slate-700/50 hover:bg-slate-900/50
                                 hover:border-blue-500/50 transition-all duration-300"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MapPin className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                
                {currentLocation && (
                    <div className="flex items-center justify-between px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
                        <span className="text-sm text-blue-400">Using current location</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setCurrentLocation(null);
                                setSearchQuery("");
                            }}
                            className="h-auto p-1 hover:bg-blue-500/10"
                        >
                            Change
                        </Button>
                    </div>
                )}
                
                {error && (
                    <p className="text-sm text-red-500 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
                        {error}
                    </p>
                )}
            </div>

            <AlertDialog open={showLocationPrompt} onOpenChange={setShowLocationPrompt}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Use Your Location</AlertDialogTitle>
                        <AlertDialogDescription>
                            Would you like to use your current location to find nearby restaurants?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowLocationPrompt(false)}>
                            Enter Manually
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={getCurrentLocation}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            Use My Location
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 