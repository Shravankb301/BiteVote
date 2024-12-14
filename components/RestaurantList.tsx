"use client"
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
// import { Checkbox } from "@/components/ui/checkbox"
import { Clock, MapPin, DollarSign, Star, Phone, Globe, UtensilsCrossed, Tag } from 'lucide-react'

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: number;
  openingHours: string;
  distance: number;
  dietaryOptions: string[];
  contact: string;
  website: string;
  menuUrl: string;
  photoUrl: string;
  ambiance: string;
  serviceTypes: string[];
  tags: string[];
}

interface RestaurantListProps {
  restaurants: Restaurant[];
}

export default function RestaurantList({ restaurants }: RestaurantListProps) {
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

