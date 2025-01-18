import { Client, PlaceDetailsRequest } from "@googlemaps/google-maps-services-js";
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

const getRestaurantData = async (place_id: string, key: string): Promise<Omit<Restaurant, 'id' | 'place_id' | 'priceRange' | 'distance' | 'vicinity'> | null> => {
    const detailsParams: PlaceDetailsRequest['params'] = {
        place_id,
        fields: [
            "name",
            "rating",
            "price_level"
        ],
        key
    };

    try {
        const detailsResponse = await gmaps.placeDetails({ params: detailsParams });
        const result = detailsResponse.data.result;

        if (!result) {
            console.log(`No details found for place_id: ${place_id}`);
            return null;
        }

        return {
            name: result.name || '',
            rating: result.rating || null,
            price_level: result.price_level || null,
        };
    } catch (error) {
        console.error("Error fetching restaurant details:", error);
        throw error;
    }
};

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

        const nearbySearchParams: NearbySearchParams = {
            location: searchLocation,
            radius,
            type: 'restaurant',
            key: GOOGLE_API_KEY,
            ...(cuisine && { keyword: cuisine })
        };

        const placesResponse = await gmaps.placesNearby({ params: nearbySearchParams });
        const places = placesResponse.data.results;

        if (!places?.length) {
            return NextResponse.json({
                error: "No restaurants found in this area",
                location: searchLocation
            }, { status: 404 });
        }

        const restaurants = await Promise.all(
            (places as PlaceResult[]).map(async (place): Promise<Restaurant | null> => {
                try {
                    if (!place.place_id) {
                        console.error('Place is missing place_id:', place);
                        return null;
                    }

                    const details = await getRestaurantData(place.place_id, GOOGLE_API_KEY);
                    if (!details) {
                        console.log('No details found for restaurant:', place.name);
                        return null;
                    }

                    // Calculate distance if not provided by the API
                    const distance = place.distance ?? calculateDistance(
                        searchLocation.lat,
                        searchLocation.lng,
                        place.geometry.location.lat,
                        place.geometry.location.lng
                    );

                    return {
                        id: place.place_id,
                        ...details,
                        priceRange: '$'.repeat(details.price_level || 1),
                        distance,
                        vicinity: place.vicinity || '',
                        rating: details.rating || place.rating || null
                    };
                } catch (error) {
                    console.error(`Error processing restaurant ${place.name}:`, error);
                    return null;
                }
            })
        );

        const validRestaurants = restaurants.filter((r): r is Restaurant => r !== null);

        if (!validRestaurants.length) {
            return NextResponse.json({
                error: "Could not retrieve restaurant details",
                location: searchLocation
            }, { status: 404 });
        }

        // Sort restaurants by rating and distance
        validRestaurants.sort((a, b) => {
            if (b.rating !== a.rating) {
                return ((b.rating || 0) - (a.rating || 0));
            }
            return ((a.distance || 0) - (b.distance || 0));
        });

        // Limit to 4 restaurants
        const limitedRestaurants = validRestaurants.slice(0, 4);

        return NextResponse.json(limitedRestaurants);

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