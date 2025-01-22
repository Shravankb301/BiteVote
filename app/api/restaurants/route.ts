import { Client } from "@googlemaps/google-maps-services-js";
import { NextResponse } from 'next/server';

interface Restaurant {
    id: string;
    name: string;
    rating: number | null;
    price_level: number | null;
    priceRange: string;
    distance: number;
    vicinity: string;
}

interface NearbySearchParams {
    location: {
        lat: number;
        lng: number;
    };
    radius: number;
    type: 'restaurant';
    key: string;
    keyword?: string;
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    throw new Error("No Google API key provided in .env");
}

const gmaps = new Client({});

// Add cache interface
interface CacheEntry {
  data: Restaurant[];
  timestamp: number;
}

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const REQUESTS_PER_MINUTE = 30;
const DEFAULT_RADIUS = 2000; // Start with 2km radius
const MAX_RADIUS = 5000; // Max 5km radius
const LOCATION_CACHE_PRECISION = 3; // Round coordinates to 3 decimal places for cache

const cache: Record<string, CacheEntry> = {};
const requestTimestamps: number[] = [];

function generateCacheKey(lat: number, lng: number, cuisine: string | null | undefined): string {
    // Round coordinates to reduce cache misses for nearby locations
    const roundedLat = Number(lat.toFixed(LOCATION_CACHE_PRECISION));
    const roundedLng = Number(lng.toFixed(LOCATION_CACHE_PRECISION));
    return `${roundedLat},${roundedLng}-${cuisine || ''}`;
}

// Add rate limiting function
function checkRateLimit(): boolean {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
        requestTimestamps.shift();
    }
    if (requestTimestamps.length >= REQUESTS_PER_MINUTE) {
        return false;
    }
    requestTimestamps.push(now);
    return true;
}

// Update the PlaceResult interface
interface PlaceResult {
    place_id: string;
    name: string;
    vicinity?: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    rating?: number;
    user_ratings_total?: number;
    distance?: number;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');
        const latitude = url.searchParams.get('lat');
        const longitude = url.searchParams.get('lng');
        const cuisine = url.searchParams.get('cuisine');
        const radius = parseInt(url.searchParams.get('radius') || '5000');
        const random = url.searchParams.get('random') === 'true'; // Add random parameter

        console.log('API Request:', {
            location,
            coordinates: latitude && longitude ? `${latitude},${longitude}` : null,
            cuisine,
            radius,
            hasApiKey: !!GOOGLE_API_KEY,
            apiKeyLength: GOOGLE_API_KEY?.length
        });

        if (!GOOGLE_API_KEY) {
            throw new Error("Google API key is not configured");
        }

        let searchLocation: { lat: number; lng: number };

        // Handle coordinates-based search
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                return NextResponse.json({
                    error: "Invalid coordinates format",
                    received: { latitude, longitude }
                }, { status: 400 });
            }

            searchLocation = { lat, lng };
            console.log('Using coordinates:', searchLocation);
        } 
        // Handle address-based search
        else if (location) {
            try {
                console.log('Geocoding address:', location);
                
                // Format the address for better geocoding results
                const formattedAddress = encodeURIComponent(location.trim());
                
                const geocodeResponse = await gmaps.geocode({
                    params: {
                        address: formattedAddress,
                        key: GOOGLE_API_KEY,
                        // Add region biasing if you know your users are primarily from a specific country
                        // region: 'us', // Uncomment and set to your primary country
                        // Add bounds if you want to restrict results to a specific area
                        // bounds: { northeast: { lat: maxLat, lng: maxLng }, southwest: { lat: minLat, lng: minLng } }
                    }
                });

                console.log('Geocoding response:', {
                    status: geocodeResponse.data.status,
                    results: geocodeResponse.data.results?.length || 0,
                    formattedAddress: geocodeResponse.data.results?.[0]?.formatted_address
                });

                if (geocodeResponse.data.status === 'ZERO_RESULTS') {
                    return NextResponse.json({
                        error: "Location not found",
                        details: "Please try a more specific address or nearby city name",
                        searchedLocation: location
                    }, { status: 404 });
                }

                if (!geocodeResponse.data.results?.[0]) {
                    return NextResponse.json({
                        error: "Invalid location",
                        details: `Status: ${geocodeResponse.data.status}`,
                        searchedLocation: location
                    }, { status: 400 });
                }

                searchLocation = geocodeResponse.data.results[0].geometry.location;
                console.log('Successfully geocoded to:', {
                    location: searchLocation,
                    formattedAddress: geocodeResponse.data.results[0].formatted_address
                });
            } catch (error) {
                console.error('Geocoding error:', {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    status: (error as { response?: { status?: number } })?.response?.status,
                    data: (error as { response?: { data?: unknown } })?.response?.data
                });
                
                if ((error as { response?: { status?: number } })?.response?.status === 403) {
                    return NextResponse.json({
                        error: "Google API authentication failed",
                        details: "Please check your API key configuration and ensure it has the necessary permissions",
                        status: 403
                    }, { status: 403 });
                }
                
                return NextResponse.json({
                    error: "Failed to geocode location",
                    details: error instanceof Error ? error.message : 'Unknown error',
                    searchedLocation: location
                }, { status: 500 });
            }
        } else {
            return NextResponse.json({
                error: "Location or coordinates are required",
                received: { location, latitude, longitude }
            }, { status: 400 });
        }

        const cacheKey = generateCacheKey(searchLocation.lat, searchLocation.lng, cuisine);
        const cachedResult = cache[cacheKey];
        
        if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
            if (random) {
                const randomIndex = Math.floor(Math.random() * cachedResult.data.length);
                return NextResponse.json([cachedResult.data[randomIndex]]);
            }
            return NextResponse.json(cachedResult.data);
        }

        if (!checkRateLimit()) {
            return NextResponse.json({
                error: "Rate limit exceeded. Please try again later."
            }, { status: 429 });
        }

        // Try with smaller radius first
        let searchRadius = Math.min(radius || DEFAULT_RADIUS, MAX_RADIUS);
        let places = [];
        
        const searchParams: NearbySearchParams = {
            location: searchLocation,
            radius: searchRadius,
            type: 'restaurant',
            key: GOOGLE_API_KEY,
            ...(cuisine && { keyword: cuisine })
        };

        const response = await gmaps.placesNearby({ params: searchParams });
        places = response.data.results;

        // If no results and radius was less than max, try with max radius
        if (!places.length && searchRadius < MAX_RADIUS) {
            searchParams.radius = MAX_RADIUS;
            const expandedResponse = await gmaps.placesNearby({ params: searchParams });
            places = expandedResponse.data.results;
        }

        if (!places.length) {
            return NextResponse.json({
                error: "No restaurants found in this area",
                location: searchLocation
            }, { status: 404 });
        }

        // Process places
        const restaurants = await Promise.all(
            places.map(async (place) => {
                const placeResult = place as unknown as PlaceResult;
                const distance = calculateDistance(
                    searchLocation.lat,
                    searchLocation.lng,
                    placeResult.geometry.location.lat,
                    placeResult.geometry.location.lng
                );
                
                return {
                    id: placeResult.place_id,
                    name: placeResult.name,
                    rating: placeResult.rating || null,
                    price_level: null,
                    priceRange: '$',
                    distance,
                    vicinity: placeResult.vicinity ?? ''
                };
            })
        );

        // If random is true, randomly select one restaurant
        if (random) {
            const randomIndex = Math.floor(Math.random() * restaurants.length);
            return NextResponse.json([restaurants[randomIndex]]);
        }

        // Otherwise sort and return top 4 as before
        restaurants.sort((a, b) => {
            if (b.rating !== a.rating) return ((b.rating || 0) - (a.rating || 0));
            return (a.distance - b.distance);
        });

        const topRestaurants = restaurants.slice(0, 4);

        cache[cacheKey] = {
            data: topRestaurants,
            timestamp: Date.now()
        };

        return NextResponse.json(topRestaurants);

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

// Add this helper function to calculate distance if not provided by the API
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

//http://localhost:3000/api/restaurants?location=New%20York&cuisine=italian&radius=100