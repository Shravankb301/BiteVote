'use client'

import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "./ui/badge"
import { ArrowRight, Clock, Check, X, Sparkles, Pizza, Utensils } from 'lucide-react'
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { generateGroupCode } from "@/lib/utils";
import { useRouter } from 'next/navigation'

interface LandingPageProps {
  onGroupCreated: () => void;
}

export default function LandingPage({ onGroupCreated }: LandingPageProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')
  const [code, setCode] = useState('')

  const handleCreateGroup = () => {
    if (!groupName.trim() || !userName.trim()) return
    const code = generateGroupCode();
    const newGroup = {
      name: groupName,
      members: [userName],
      code,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('group', JSON.stringify(newGroup))
    localStorage.setItem('currentUser', userName.trim())
    setCode(code)
    setIsModalOpen(false)
    onGroupCreated()
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-violet-950 via-slate-900 to-slate-950 overflow-y-auto">
        {/* Optimized background elements */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none translate-z-0" />
        <div className="fixed inset-0 pointer-events-none translate-z-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob will-change-transform" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 will-change-transform" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 will-change-transform" />
        </div>
        
        {/* Content sections with optimized animations */}
        <div className="relative content-visible">
          {/* Hero Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.1,
                },
              },
            }}
          >
            <section className="relative container mx-auto px-4 pt-32 pb-20">
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 20
                    }
                  }
                }}
                className="max-w-3xl mx-auto text-center"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20 py-2 px-4 animate-pulse">
                    <Sparkles className="w-4 h-4 mr-2 inline-block animate-spin-slow" />
                    Stop the endless group chat debates
                  </Badge>
                </motion.div>

                <div className="relative">
                  <motion.h1 
                    className="text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    Stop asking
                    <br />
                    <span className="relative inline-block">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                        &ldquo;What do you want to eat?&rdquo;
                      </span>
                      <motion.div
                        className="absolute -right-8 -top-6"
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 10, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <Pizza className="w-8 h-8 text-yellow-400" />
                      </motion.div>
                      <motion.div
                        className="absolute -left-8 -bottom-4"
                        initial={{ rotate: 10, scale: 0 }}
                        animate={{ rotate: -10, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <Utensils className="w-6 h-6 text-blue-400" />
                      </motion.div>
                    </span>
                  </motion.h1>

                  <div className="relative">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="flex flex-col items-center text-xl text-slate-300 mb-12 max-w-2xl mx-auto space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <motion.span
                          className="relative inline-flex items-center text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          Effortless dining decisions,
                        </motion.span>
                        <motion.span
                          className="relative inline-flex items-center text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          zero debates,
                        </motion.span>
                        <motion.span
                          className="relative inline-flex items-center text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                        >
                          all delicious!
                        </motion.span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg text-slate-400">
                          From indecision to satisfaction in minutes
                        </span>
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <Pizza className="w-5 h-5 text-yellow-400 inline-block" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <div className="relative inline-flex gap-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          onClick={() => setIsModalOpen(true)}
                          className="relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-full group shadow-lg shadow-purple-500/25"
                        >
                          Start Planning Now
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </motion.div>
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          onClick={() => router.push('/randomizer')}
                          className="relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-full group shadow-lg shadow-purple-500/25"
                        >
                          Randomizer
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </section>
          </motion.div>

          {/* Features Section */}
          <motion.section 
            className="relative py-20 border-t border-slate-800/50 backdrop-blur-sm"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            <div className="container mx-auto px-4">
              <motion.h2 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="text-3xl font-bold mb-16 text-center text-white"
              >
                Why Choose BitVote?
              </motion.h2>
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <Card className="p-6 bg-slate-900/50 border-slate-800/50 hover:border-blue-500/50 transition-all duration-300 group backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10">
                      {feature.icon}
                      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-slate-300">{feature.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Comparison Section */}
          <section className="relative py-20 border-t border-slate-800">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl font-bold text-white mb-4">
                  The Smart Way to Decide
                </h2>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                  See how BitVote transforms the group decision-making process
                </p>
              </motion.div>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 bg-red-500/5 border-red-500/20 hover:bg-red-500/10 transition-colors">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mr-4">
                        <X className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Traditional Way</h3>
                        <p className="text-red-400">The old, painful process</p>
                      </div>
                    </div>
                    <div className="flex items-center mb-6 bg-red-500/5 rounded-lg p-4">
                      <Clock className="text-red-500 mr-3 h-5 w-5" />
                      <div>
                        <span className="text-2xl font-bold text-red-500">45+ minutes</span>
                        <p className="text-sm text-slate-400">Average decision time</p>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {withoutAppPoints.map((point, index) => (
                        <motion.li
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          key={index}
                          className="flex items-start group"
                        >
                          <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-red-500/20 transition-colors">
                            <span className="text-red-500 text-sm">{index + 1}</span>
                          </span>
                          <div>
                            <p className="text-slate-300 font-medium">{point}</p>
                            <p className="text-sm text-slate-500">{traditionalPainPoints[index]}</p>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 bg-green-500/5 border-green-500/20 hover:bg-green-500/10 transition-colors">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mr-4">
                        <Check className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">BitVote Way</h3>
                        <p className="text-green-400">The smart solution</p>
                      </div>
                    </div>
                    <div className="flex items-center mb-6 bg-green-500/5 rounded-lg p-4">
                      <Clock className="text-green-500 mr-3 h-5 w-5" />
                      <div>
                        <span className="text-2xl font-bold text-green-500">5 minutes</span>
                        <p className="text-sm text-slate-400">Average decision time</p>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {withAppPoints.map((point, index) => (
                        <motion.li
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          key={index}
                          className="flex items-start group"
                        >
                          <span className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-green-500/20 transition-colors">
                            <Check className="w-4 h-4 text-green-500" />
                          </span>
                          <div>
                            <p className="text-slate-300 font-medium">{point}</p>
                            <p className="text-sm text-slate-500">{bitVoteBenefits[index]}</p>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-20 border-t border-slate-800">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-6 text-white">
                Ready to make decisions easier with BitVote?
              </h2>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
                Join thousands of groups who have simplified their dining decisions with BitVote.
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
      </div>

      {/* Group Creation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create Your Group</DialogTitle>
            <DialogDescription asChild>
              <div className="text-slate-400">
                <p>Enter your details to start planning with your group.</p>
                {code && (
                  <div className="mt-2">
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Your group code: {code}
                    </Badge>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupName" className="text-white">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userName" className="text-white">Your Name</Label>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCreateGroup}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              disabled={!groupName.trim() || !userName.trim()}
            >
              Create Group & Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const features = [
  {
    icon: <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-2xl">🏎️</span>
          </div>,
    title: "Quick Setup",
    description: "Create a group and invite friends in seconds. No registration required."
  },
  {
    icon: <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-2xl">⏳</span>
          </div>,
    title: "Real-time Voting",
    description: "Everyone votes simultaneously. No waiting for responses."
  },
  {
    icon: <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>,
    title: "Smart Results",
    description: "Get instant results that everyone can agree on."
  }
]

const withoutAppPoints = [
  "Multiple Group Chats",
  "Endless Waiting",
  "Preference Chaos",
  "Message Overload"
]

const traditionalPainPoints = [
  "Different groups on WhatsApp, Messenger, and other apps",
  "People take hours to respond or forget to reply",
  "Everyone has different preferences and dietary restrictions",
  "Hundreds of messages just to pick a restaurant"
]

const withAppPoints = [
  "Unified Platform",
  "Real-time Voting",
  "Smart Matching",
  "Instant Results"
]

const bitVoteBenefits = [
  "One place for all your group decisions, no app switching needed",
  "Everyone votes at their convenience, results in minutes",
  "Our algorithm considers everyone's preferences fairly",
  "Clear winner selection without endless discussion"
]

