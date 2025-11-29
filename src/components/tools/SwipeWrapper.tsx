"use client";

import React, { ReactNode, useRef } from 'react';

interface SwipeWrapperProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
}

export const SwipeWrapper = ({ children, onSwipeLeft, onSwipeRight, className }: SwipeWrapperProps) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Minimum distance to be considered a swipe (px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      // Positive distance = Swipe Left (Next)
      if (distance > 0) {
        onSwipeLeft();
      } 
      // Negative distance = Swipe Right (Back)
      else {
        onSwipeRight();
      }
    } else {
      // It was a Tap (not a swipe), check screen zones
      const screenWidth = window.innerWidth;
      const tapX = touchEndX.current;
      
      // If tap was in the left 15% of screen
      if (tapX < screenWidth * 0.15) {
        onSwipeRight(); // Back
      }
      // If tap was in the right 15% of screen
      else if (tapX > screenWidth * 0.85) {
        onSwipeLeft(); // Next
      }
    }
  };

  return (
    <div 
      className={className}
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
};
