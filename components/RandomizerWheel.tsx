"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface RandomizerWheelProps {
  segments: number;
  spinning: boolean;
  selectedSegment: number | null;
  onSpin: () => void;
}

export default function RandomizerWheel({ 
  segments,
  spinning, 
  selectedSegment,
  onSpin
}: RandomizerWheelProps) {
  const wheelSize = 400;
  const segmentAngle = 360 / segments;
  const [glowIndex, setGlowIndex] = useState<number | null>(null);
  const segmentOffset = segmentAngle / 2;

  // Colors for segments
  const baseColors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-orange-500',
  ];

  const getSegmentStyle = (index: number) => {
    const color = baseColors[index % baseColors.length];
    const isGlowing = glowIndex === index;
    
    return {
      className: `
        absolute inset-0 origin-center
        ${color}
        ${isGlowing ? 'brightness-125' : ''}
        transition-all duration-150
      `,
      style: {
        clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.tan(Math.PI / segments)}% 0, 50% 50%)`,
        transform: `rotate(${index * segmentAngle}deg)`,
      }
    };
  };

  // Enhanced glow animation during spin
  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        setGlowIndex(prev => (prev === null ? 0 : (prev + 1) % segments));
      }, 50); // Faster glow animation
      return () => clearInterval(interval);
    } else {
      setGlowIndex(selectedSegment);
    }
  }, [spinning, segments, selectedSegment]);

  const getWheelRotation = () => {
    if (!spinning && selectedSegment === null) {
      return segmentOffset;
    }
    
    if (spinning) {
      const spinRotations = 7 * 360; // More rotations
      const targetRotation = selectedSegment != null 
        ? (segments - selectedSegment) * segmentAngle - segmentOffset
        : 0;
      return spinRotations + targetRotation;
    }
    
    return (segments - (selectedSegment || 0)) * segmentAngle - segmentOffset;
  };

  return (
    <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
      {/* Spinner Arrow */}
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20"
        animate={spinning ? {
          scale: [1, 1.2, 1],
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ 
          duration: 0.5, 
          repeat: spinning ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 blur-md bg-red-500/50" />
      </motion.div>

      {/* Wheel */}
      <motion.div
        className="w-full h-full rounded-full relative overflow-hidden shadow-2xl cursor-pointer"
        initial={{ rotate: segmentOffset }}
        animate={{
          rotate: getWheelRotation(),
          scale: spinning ? [1, 1.03, 1] : 1,
        }}
        transition={{
          rotate: {
            duration: spinning ? 5 : 0.5,
            ease: spinning ? [0.2, 0.1, 0.3, 1] : "easeInOut"
          },
          scale: {
            duration: 0.7,
            repeat: spinning ? Infinity : 0,
            ease: "easeInOut"
          }
        }}
        onClick={!spinning ? onSpin : undefined}
      >
        {/* Background */}
        <div className="absolute inset-0 rounded-full bg-slate-900" />

        {/* Segments */}
        {Array.from({ length: segments }).map((_, index) => {
          const { className, style } = getSegmentStyle(index);
          return (
            <div
              key={index}
              className={className}
              style={style}
            />
          );
        })}

        {/* Divider Lines */}
        {Array.from({ length: segments }).map((_, index) => (
          <div
            key={`divider-${index}`}
            className="absolute top-0 left-1/2 h-1/2 w-[2px] bg-slate-900"
            style={{
              transform: `rotate(${index * segmentAngle}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
        ))}

        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-800" />

        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
      </motion.div>

      {/* Outer Glow */}
      <motion.div 
        className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl"
        animate={{ 
          scale: [1.1, 1.15, 1.1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
} 