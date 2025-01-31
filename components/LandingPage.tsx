'use client'

import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "./ui/badge"
import { ArrowRight, Clock, Check, X, Sparkles, Pizza, Utensils, Briefcase, GraduationCap, User, Twitter, Linkedin, PhoneCall, ArrowDown, MessageSquare } from 'lucide-react'
import { LucideGithub } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { generateGroupCode } from "@/lib/utils";
import { useRouter } from 'next/navigation'
import { Textarea } from "@/components/ui/textarea"
import Logo from "@/components/Logo"

// ShareFeedback Component
const ShareFeedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setFeedback('');
      setIsOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-2 font-medium flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Share Feedback
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 right-0 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-4"
          >
            <Label htmlFor="feedback" className="text-white mb-2 block">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Enter your feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mb-4 min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 right-0 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-lg"
          >
            Thank you for your feedback!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// CheckOutArrow Component
const CheckOutArrow = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Get the scroll position
      const scrollPosition = window.scrollY;
      // Hide the arrow when scrolled past 300px (before reaching the features section)
      setVisible(scrollPosition < 300);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed left-8 top-[70vh] z-50 hidden md:flex flex-col items-center pointer-events-none md:pointer-events-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 20,
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-white text-lg font-semibold mb-2 bg-blue-500/10 px-4 py-2 rounded-full backdrop-blur-sm border border-blue-500/20"
        animate={{ y: visible ? [0, -5, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        See more!
      </motion.div>
      <motion.div
        animate={{ y: visible ? [0, 5, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ArrowDown className="w-8 h-8 text-blue-500" />
      </motion.div>
    </motion.div>
  )
}

interface LandingPageProps {
  onGroupCreated: () => void;
}

export default function LandingPage({ onGroupCreated }: LandingPageProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [userName, setUserName] = useState('')
  const [code, setCode] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !userName.trim() || isCreating) return
    
    setIsCreating(true)
    const code = generateGroupCode();
    const newGroup = {
      name: groupName,
      members: [userName],
      code,
      lastUpdated: new Date().toISOString()
    }

    try {
      // Create session on the server first
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          groupData: newGroup
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      // If server creation successful, save to localStorage
      localStorage.setItem('group', JSON.stringify(newGroup))
      localStorage.setItem('currentUser', userName.trim())
      setCode(code)
      setIsModalOpen(false)
      onGroupCreated()
    } catch (error) {
      console.error('Error creating group:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsCreating(false)
    }
  }

  const handlePickRestaurants = () => {
    setIsModalOpen(true)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-violet-950 via-slate-900 to-slate-950 overflow-y-auto">
        {/* Logo is now handled by the Logo component */}
        <Logo />
        
        {/* Add ShareFeedback component */}
        <ShareFeedback />
        
        {/* Background elements */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none translate-z-0" />
        <div className="fixed inset-0 pointer-events-none translate-z-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob will-change-transform" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 will-change-transform" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 will-change-transform" />
        </div>
        
        {/* Content sections */}
        <div className="relative content-visible">
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
            <section className="relative container mx-auto px-4 pt-20 md:pt-32 pb-12 md:pb-20">
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
                  <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20 py-1.5 md:py-2 px-3 md:px-4 text-sm md:text-base animate-pulse">
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 inline-block animate-spin-slow" />
                    Stop the endless group chat debates
                  </Badge>
                </motion.div>

                <div className="relative">
                  <motion.h1 
                    className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
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
                        className="absolute -right-6 md:-right-8 -top-4 md:-top-6"
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 10, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <Pizza className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
                      </motion.div>
                      <motion.div
                        className="absolute -left-6 md:-left-8 -bottom-3 md:-bottom-4"
                        initial={{ rotate: 10, scale: 0 }}
                        animate={{ rotate: -10, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <Utensils className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                      </motion.div>
                    </span>
                  </motion.h1>

                  <div className="relative">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="flex flex-col items-center text-base md:text-xl text-slate-300 mb-8 md:mb-12 max-w-2xl mx-auto space-y-3 md:space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 px-4">
                        <motion.span
                          className="relative inline-flex items-center text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          All Your Dining Needs,
                        </motion.span>
                        <motion.span
                          className="relative inline-flex items-center text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          Effortless Decisions
                        </motion.span>
                        <motion.span
                          className="relative inline-flex items-center text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                        >
                          and Seamless Bill Splitting!
                          <motion.div
                            className="inline-block ml-2"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <Pizza className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                          </motion.div>
                        </motion.span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {/* <span className="text-base md:text-lg text-slate-400">
                          From indecision to satisfaction in minutes
                        </span> */}
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <div className="relative flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto"
                      >
                        <Button 
                          onClick={handlePickRestaurants}
                          className="relative w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg rounded-full group shadow-lg shadow-purple-500/25"
                        >
                          Live vote restaurants
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                          </motion.div>
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto"
                      >
                        <Button 
                          onClick={() => router.push('/split-bill')}
                          className="relative w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg rounded-full group shadow-lg shadow-purple-500/25"
                        >
                          Split the bill
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                          </motion.div>
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto"
                      >
                        <Button 
                          onClick={() => router.push('/randomizer')}
                          className="relative w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg rounded-full group shadow-lg shadow-purple-500/25"
                        >
                          Randomizer
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
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
                Join groups from around the world who have simplified their dining decisions with BitVote.
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

          {/* About Me Section */}
          <AboutMeSection />
        </div>
      </div>

      {/* Add CheckOutArrow component */}
      <CheckOutArrow />

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
              disabled={!groupName.trim() || !userName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  Creating...
                  <span className="ml-2 animate-spin">⏳</span>
                </>
              ) : (
                <>
                  Create Group & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
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
            <Image 
              src="/venmo.png"
              alt="Target icon"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>,
    title: "Split Bills with Venmo",
    description: "Share and settle bills instantly with Venmo. Scan to pay!"
  }
]

const withoutAppPoints = [
  "Multiple Group Chats",
  "Endless Waiting",
  "Preference Chaos",
  "Message Overload",
  "Manual Bill Splitting"
]

const traditionalPainPoints = [
  "Different groups on WhatsApp, Messenger, and other apps",
  "People take hours to respond or forget to reply",
  "Everyone has different preferences and dietary restrictions",
  "Hundreds of messages just to pick a restaurant",
  "Manually calculating and sending multiple Venmo requests"
]

const withAppPoints = [
  "Unified Platform",
  "Real-time Voting",
  "Smart Matching",
  "Instant Results",
  "Automated Bill Splitting"
]

const bitVoteBenefits = [
  "One place for all your group decisions, no app switching needed",
  "Everyone votes at their convenience, results in minutes",
  "Our algorithm considers everyone's preferences fairly",
  "Clear winner selection without endless discussion",
  "Instant Venmo payments with QR codes and direct links"
]

function AboutMeSection() {
  return (
    <section id="about-me" className="relative py-24 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
        >
          About Me
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Image
              src="/58829827.jpeg"
              width={400}
              height={400}
              alt="Shravan Komarabattini"
              className="rounded-full mx-auto"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Hello! I&apos;m Shravan Komarabattini</h3>
            <p className="text-slate-300 mb-6">
              An Engineer with a background in Computer Science and Mathematics from Purdue University. I specialize in building scalable, efficient solutions, from backend engineering and data to automating workflows and enhancing tasks with AI. My focus is on developing clean, impactful code and streamlining processes to drive user experience and business efficiency.

              Outside of work, I&apos;m passionate about continuous learning, exploring new tech, and maintaining a balanced routine with fitness and personal growth. Excited to connect, collaborate, and push the boundaries of tech innovation!
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Briefcase className="text-blue-500 w-6 h-6" />
                <span className="text-slate-300">Engineer at Swiss Re</span>
              </div>
              <div className="flex items-center space-x-4">
                <GraduationCap className="text-blue-500 w-6 h-6" />
                <span className="text-slate-300">BS in Computer Science & Mathematics, Purdue University</span>
              </div>
              <div className="flex items-center space-x-4">
                <User className="text-blue-500 w-6 h-6" />
                <span className="text-slate-300">Engineering, Product & AI Enthusiast</span>
              </div>
            </div>
          </motion.div>
        </div>
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="https://x.com/shravankb301" target="_blank" rel="noopener noreferrer">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-5 text-base rounded-full group shadow-lg shadow-purple-500/25"
              >
                <Twitter className="mr-2 h-5 w-5" />
                Follow on X
              </Button>
            </Link>
            <Link href="https://www.linkedin.com/in/shravan-komarabattini/" target="_blank" rel="noopener noreferrer">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-5 text-base rounded-full group shadow-lg shadow-purple-500/25"
              >
                <Linkedin className="mr-2 h-5 w-5" />
                Connect on LinkedIn
              </Button>
            </Link>
            <Link href="https://github.com/Shravankb301" target="_blank" rel="noopener noreferrer">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-5 text-base rounded-full group shadow-lg shadow-purple-500/25"
              >
                <LucideGithub className="mr-2 h-5 w-5" /> 
                Check out Github
              </Button>
            </Link>
            <Link href="https://calendly.com/shravankb/1-1" target="_blank" rel="noopener noreferrer">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-5 text-base rounded-full group shadow-lg shadow-purple-500/25"
              >
                <PhoneCall className="mr-2 h-5 w-5" /> 
                Schedule a call
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

