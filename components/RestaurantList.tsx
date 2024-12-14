import React, { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, MapPin, DollarSign, Star, Phone, Globe, UtensilsCrossed, Tag } from 'lucide-react'

// Expanded restaurant data
const restaurants = [
  { 
    id: '1', 
    name: 'Pizza Place', 
    cuisine: 'Italian', 
    rating: 4.5, 
    priceRange: 2,
    openingHours: '11:00 AM - 10:00 PM',
    distance: 0.5,
    dietaryOptions: ['vegetarian'],
    contact: '+1 (555) 123-4567',
    website: 'https://pizzaplace.com',
    menuUrl: 'https://pizzaplace.com/menu',
    photoUrl: 'https://example.com/pizzaplace.jpg',
    ambiance: 'casual',
    serviceTypes: ['dine-in', 'takeout', 'delivery'],
    tags: ['family-friendly', 'great for groups']
  },
  { 
    id: '2', 
    name: 'Burger Joint', 
    cuisine: 'American', 
    rating: 4.2, 
    priceRange: 1,
    openingHours: '10:00 AM - 11:00 PM',
    distance: 1.2,
    dietaryOptions: ['gluten-free'],
    contact: '+1 (555) 987-6543',
    website: 'https://burgerjoint.com',
    menuUrl: 'https://burgerjoint.com/menu',
    photoUrl: 'https://example.com/burgerjoint.jpg',
    ambiance: 'casual',
    serviceTypes: ['dine-in', 'takeout'],
    tags: ['quick service', 'late night']
  },
  { 
    id: '3', 
    name: 'Sushi Spot', 
    cuisine: 'Japanese', 
    rating: 4.8, 
    priceRange: 3,
    openingHours: '12:00 PM - 10:00 PM',
    distance: 0.8,
    dietaryOptions: ['vegan', 'gluten-free'],
    contact: '+1 (555) 246-8101',
    website: 'https://sushispot.com',
    menuUrl: 'https://sushispot.com/menu',
    photoUrl: 'https://example.com/sushispot.jpg',
    ambiance: 'formal',
    serviceTypes: ['dine-in', 'takeout'],
    tags: ['date night', 'quiet atmosphere']
  },
  { 
    id: '4', 
    name: 'Taco Town', 
    cuisine: 'Mexican', 
    rating: 4.3, 
    priceRange: 1,
    openingHours: '11:00 AM - 9:00 PM',
    distance: 1.5,
    dietaryOptions: ['vegetarian'],
    contact: '+1 (555) 369-2580',
    website: 'https://tacotown.com',
    menuUrl: 'https://tacotown.com/menu',
    photoUrl: 'https://example.com/tacotown.jpg',
    ambiance: 'casual',
    serviceTypes: ['dine-in', 'takeout', 'delivery'],
    tags: ['quick service', 'great for lunch']
  },
  { 
    id: '5', 
    name: 'Curry House', 
    cuisine: 'Indian', 
    rating: 4.6, 
    priceRange: 2,
    openingHours: '12:00 PM - 11:00 PM',
    distance: 2.0,
    dietaryOptions: ['vegetarian', 'vegan'],
    contact: '+1 (555) 147-2589',
    website: 'https://curryhouse.com',
    menuUrl: 'https://curryhouse.com/menu',
    photoUrl: 'https://example.com/curryhouse.jpg',
    ambiance: 'casual',
    serviceTypes: ['dine-in', 'takeout', 'delivery'],
    tags: ['spicy food', 'great for groups']
  },
]

interface RestaurantListProps {
  group: { name: string; members: string[]; code: string } | null
}

export default function RestaurantList({ group }: RestaurantListProps) {
  const [dietaryFilter, setDietaryFilter] = useState<string[]>([])
  const [cuisineFilter, setCuisineFilter] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<number>(3)
  const [distanceFilter, setDistanceFilter] = useState<number>(5)
  const [ambianceFilter, setAmbianceFilter] = useState<string>('all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string>('all')

  const filteredRestaurants = restaurants.filter((restaurant) => (
    (dietaryFilter.length === 0 || dietaryFilter.some((filter) => restaurant.dietaryOptions.includes(filter))) &&
    (cuisineFilter === 'all' || restaurant.cuisine === cuisineFilter) &&
    (restaurant.priceRange <= priceFilter) &&
    (restaurant.distance <= distanceFilter) &&
    (ambianceFilter === 'all' || restaurant.ambiance === ambianceFilter) &&
    (serviceTypeFilter.length === 0 || serviceTypeFilter.some(type => restaurant.serviceTypes.includes(type))) &&
    (tagFilter === 'all' || restaurant.tags.includes(tagFilter))
  ))

  const handleDietaryFilterChange = (option: string) => {
    setDietaryFilter((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    )
  }

  const handleServiceTypeFilterChange = (option: string) => {
    setServiceTypeFilter((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    )
  }

  const cuisineOptions = Array.from(new Set(restaurants.map(r => r.cuisine)))
  const ambianceOptions = Array.from(new Set(restaurants.map(r => r.ambiance)))
  const serviceTypeOptions = Array.from(new Set(restaurants.flatMap(r => r.serviceTypes)))
  const tagOptions = Array.from(new Set(restaurants.flatMap(r => r.tags)))

  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-700">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600">Dietary Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {['vegetarian', 'vegan', 'gluten-free'].map((option) => (
                <Button
                  key={option}
                  variant={dietaryFilter.includes(option) ? "default" : "outline"}
                  onClick={() => handleDietaryFilterChange(option)}
                  size="sm"
                  className={dietaryFilter.includes(option) ? "bg-blue-500 text-white" : "text-blue-500 border-blue-300"}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600">Cuisine</h4>
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisines</SelectItem>
                {cuisineOptions.map((cuisine) => (
                  <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600">Max Price Range: ${priceFilter}</h4>
            <Slider
              min={1}
              max={3}
              step={1}
              value={[priceFilter]}
              onValueChange={(value) => setPriceFilter(value[0])}
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600">Max Distance: {distanceFilter} miles</h4>
            <Slider
              min={0.5}
              max={5}
              step={0.5}
              value={[distanceFilter]}
              onValueChange={(value) => setDistanceFilter(value[0])}
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600">Ambiance</h4>
            <Select value={ambianceFilter} onValueChange={setAmbianceFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select ambiance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ambiances</SelectItem>
                {ambianceOptions.map((ambiance) => (
                  <SelectItem key={ambiance} value={ambiance}>{ambiance}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600">Service Type</h4>
            <div className="flex flex-wrap gap-2">
              {serviceTypeOptions.map((option) => (
                <Button
                  key={option}
                  variant={serviceTypeFilter.includes(option) ? "default" : "outline"}
                  onClick={() => handleServiceTypeFilterChange(option)}
                  size="sm"
                  className={serviceTypeFilter.includes(option) ? "bg-blue-500 text-white" : "text-blue-500 border-blue-300"}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-600">Tags</h4>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tagOptions.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="grid gap-4">
        {filteredRestaurants.map((restaurant) => (
          <Card key={restaurant.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-blue-700">{restaurant.name}</h3>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  {restaurant.rating} <Star className="h-4 w-4 inline text-yellow-500" />
                </Badge>
              </div>
              <p className="text-blue-600">{restaurant.cuisine}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-blue-500">
                <span className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {'$'.repeat(restaurant.priceRange)}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {restaurant.openingHours}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {restaurant.distance} miles
                </span>
                <span className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {restaurant.contact}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {restaurant.dietaryOptions.map((option) => (
                  <Badge key={option} variant="outline" className="border-green-300 text-green-600">
                    {option}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-600">{restaurant.ambiance}</Badge>
                {restaurant.serviceTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="bg-blue-100 text-blue-600">{type}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {restaurant.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-blue-300 text-blue-500">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button asChild variant="outline" size="sm" className="text-blue-500 border-blue-300">
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="text-blue-500 border-blue-300">
                  <a href={restaurant.menuUrl} target="_blank" rel="noopener noreferrer">
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Menu
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="text-blue-500 border-blue-300">
                  <a href={restaurant.photoUrl} target="_blank" rel="noopener noreferrer">
                    <Star className="h-4 w-4 mr-2" />
                    Photos
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

