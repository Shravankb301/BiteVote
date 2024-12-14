'use client'

import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { nanoid } from 'nanoid'
import { Badge } from "./ui/badge"
import { ArrowRight, Clock, Users, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface LandingPageProps {
  onGroupCreated: () => void;
}

export default function LandingPage({ onGroupCreated }: LandingPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')

  const handleCreateGroup = () => {
    if (!groupName.trim() || !userName.trim()) return
    const groupCode = nanoid(4)
    const group = {
      name: groupName,
      members: [userName],
      code: groupCode
    }
    localStorage.setItem('group', JSON.stringify(group))
    setIsModalOpen(false)
    onGroupCreated()
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Section */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <section className="relative container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20 py-2 px-4">
              Stop the endless group chat debates
            </Badge>
            <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Stop asking
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                "What do you want to eat?"
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Make restaurant decisions in minutes, not hours. 
              No more endless back-and-forth messages.
            </p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-full group"
            >
              Start Planning Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 border-t border-slate-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center text-white">
              Why Choose Our App?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-6 bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="relative py-20 border-t border-slate-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center text-white">
              The Better Way to Decide
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-6 bg-red-500/5 border-red-500/20">
                <div className="flex items-center mb-4">
                  <X className="w-8 h-8 text-red-500 mr-3" />
                  <h3 className="text-xl font-bold text-white">Without Our App</h3>
                </div>
                <div className="flex items-center mb-4">
                  <Clock className="text-red-500 mr-2" />
                  <span className="text-2xl font-bold text-red-500">45+ minutes</span>
                </div>
                <ul className="space-y-3 text-slate-300">
                  {withoutAppPoints.map((point, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mr-2" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6 bg-green-500/5 border-green-500/20">
                <div className="flex items-center mb-4">
                  <Check className="w-8 h-8 text-green-500 mr-3" />
                  <h3 className="text-xl font-bold text-white">With Our App</h3>
                </div>
                <div className="flex items-center mb-4">
                  <Clock className="text-green-500 mr-2" />
                  <span className="text-2xl font-bold text-green-500">5 minutes</span>
                </div>
                <ul className="space-y-3 text-slate-300">
                  {withAppPoints.map((point, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 mr-2" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 border-t border-slate-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">
              Ready to make decisions easier?
            </h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
              Join thousands of groups who have simplified their dining decisions.
            </p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-full group"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
            </Button>
          </div>
        </section>
      </div>

      {/* Group Creation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Your Group</DialogTitle>
            <DialogDescription>
              Enter your details to start planning with your group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userName">Your Name</Label>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCreateGroup}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!groupName.trim() || !userName.trim()}
            >
              Create Group & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const features = [
  {
    icon: "👥",
    title: "Quick Setup",
    description: "Create a group and invite friends in seconds. No registration required."
  },
  {
    icon: "⚡",
    title: "Real-time Voting",
    description: "Everyone votes simultaneously. No waiting for responses."
  },
  {
    icon: "🎯",
    title: "Smart Results",
    description: "Get instant results that everyone can agree on."
  }
]

const withoutAppPoints = [
  "Creating multiple group chats",
  "Waiting hours for responses",
  "Managing conflicting preferences",
  "Endless back-and-forth messages"
]

const withAppPoints = [
  "One-click group creation",
  "Instant voting system",
  "Automatic preference matching",
  "Quick, fair decisions"
]

