import React from 'react';
import type { Mood } from '@/lib/mock-data';
import { moodColors } from '@/lib/mock-data';

interface MoodBadgeProps {
  mood: Mood;
  size?: 'sm' | 'md' | 'lg';
  label?: boolean;
}

const moodLabels: Record<Mood, string> = {
  excellent: 'Excellent',
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  sad: 'Sad',
  anxious: 'Anxious',
};

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export function MoodBadge({ mood, size = 'md', label = false }: MoodBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full ${moodColors[mood]} ${sizeClasses[size]}`} />
      {label && <span className="text-sm font-medium">{moodLabels[mood]}</span>}
    </div>
  );
}
