"use client";

import { useState, useEffect, useCallback } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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
    const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);
    const [hasAttemptedAutoDetect, setHasAttemptedAutoDetect] = useState(false);
    const { toast } = useToast();

    const getCurrentLocation = useCallback(() => {
        setIsLoading(true);
        setError(null);

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
                    
                    // Save to localStorage for future use
                    localStorage.setItem('lastKnownLocation', JSON.stringify(coords));
                    
                    toast({
                        title: "Location detected",
                        description: "Using your current location to find nearby restaurants.",
                    });
                } catch (error) {
                    console.error('Error processing coordinates:', error);
                    setError("Error processing location data");
                    toast({
                        title: "Error",
                        description: "Failed to process location data.",
                        variant: "destructive",
                    });
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = "Unable to retrieve your location. ";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Please enable location access in your browser settings to find nearby restaurants.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                    default:
                        errorMessage += "Please try again.";
                }
                setError(errorMessage);
                toast({
                    title: "Location Error",
                    description: errorMessage,
                    variant: "destructive",
                });
                setIsLoading(false);
                
                // If auto-detection fails, try to use last known location
                const savedLocation = localStorage.getItem('lastKnownLocation');
                if (savedLocation) {
                    try {
                        const parsed = JSON.parse(savedLocation);
                        setCurrentLocation(parsed);
                        onLocationSelect(parsed);
                        toast({
                            title: "Using saved location",
                            description: "Using your last known location as fallback.",
                        });
                    } catch (e) {
                        console.error('Error restoring location:', e);
                        localStorage.removeItem('lastKnownLocation');
                    }
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 } // Allow locations up to 5 minutes old
        );
    }, [onLocationSelect, toast]);

    // Check for stored location permission and attempt auto-detection
    useEffect(() => {
        const checkPermissionAndAutoDetect = async () => {
            if (hasAttemptedAutoDetect) return;
            
            try {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                setLocationPermission(permission.state);
                
                // Listen for permission changes
                permission.addEventListener('change', () => {
                    setLocationPermission(permission.state);
                });

                // Auto-detect if permission is already granted or if autoDetectOnMount is true
                if (permission.state === 'granted' || autoDetectOnMount) {
                    getCurrentLocation();
                }

                setHasAttemptedAutoDetect(true);
            } catch (error) {
                console.error('Error checking location permission:', error);
                setHasAttemptedAutoDetect(true);
            }
        };

        checkPermissionAndAutoDetect();
    }, [autoDetectOnMount, hasAttemptedAutoDetect, getCurrentLocation]);

    // Try to restore location from localStorage
    useEffect(() => {
        if (!currentLocation && !isLoading) {
            const savedLocation = localStorage.getItem('lastKnownLocation');
            if (savedLocation) {
                try {
                    const parsed = JSON.parse(savedLocation);
                    setCurrentLocation(parsed);
                    onLocationSelect(parsed);
                    toast({
                        title: "Location restored",
                        description: "Using your last known location.",
                    });
                } catch (error) {
                    console.error('Error restoring location:', error);
                    localStorage.removeItem('lastKnownLocation');
                }
            }
        }
    }, [currentLocation, isLoading, onLocationSelect, toast]);

    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLocation) {
            // If no location, try to get it first
            getCurrentLocation();
            return;
        }
        
        if (searchQuery.trim()) {
            onLocationSelect({ ...currentLocation, query: searchQuery.trim() });
        }
    }, [currentLocation, searchQuery, getCurrentLocation, onLocationSelect]);

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-2">
                <form onSubmit={handleSearchSubmit} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder={currentLocation 
                                ? "Search for restaurants..." 
                                : "Enable location to find nearby restaurants"}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setError(null);
                            }}
                            className="pl-10 bg-slate-900/30 border-slate-700/50 text-white 
                                     focus:border-blue-500/50 focus:ring-purple-500/20 transition-all duration-300
                                     hover:bg-slate-900/50"
                            disabled={isLoading}
                        />
                        {!currentLocation && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-400">
                                Press 📍 to detect
                            </div>
                        )}
                    </div>
                </form>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                    className={cn(
                        "shrink-0 bg-slate-900/30 border-slate-700/50 hover:bg-slate-900/50",
                        "hover:border-blue-500/50 transition-all duration-300",
                        locationPermission === 'granted' && "border-green-500/50 text-green-400"
                    )}
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
                <div 
                    className="text-sm text-red-500 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md"
                    role="alert"
                >
                    {error}
                </div>
            )}
        </div>
    );
} 