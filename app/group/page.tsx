import React from 'react';
import GroupInfo from '../../components/GroupInfo';
import RestaurantList from '../../components/RestaurantList';

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

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  restaurants?: Restaurant[];
  code: string;
}

export default function GroupPage() {
  const group: Group = {
    id: '1',
    name: 'Sample Group',
    description: 'This is a sample group',
    members: [],
    restaurants: [
      {
        id: '1',
        name: 'Sample Restaurant',
        cuisine: 'Italian',
        rating: 4.5,
        priceRange: 2,
        openingHours: '11:00 AM - 10:00 PM',
        distance: 0.5,
        dietaryOptions: ['vegetarian'],
        contact: '+1 (555) 123-4567',
        website: 'https://samplerestaurant.com',
        menuUrl: 'https://samplerestaurant.com/menu',
        photoUrl: 'https://example.com/sample.jpg',
        ambiance: 'casual',
        serviceTypes: ['dine-in', 'takeout'],
        tags: ['family-friendly']
      }
    ],
    code: 'GROUP123',
  };

  return (
    <div className="space-y-6" suppressHydrationWarning={true}>
      <GroupInfo group={group} />
      <RestaurantList restaurants={group.restaurants || []} />
    </div>
  );
}

