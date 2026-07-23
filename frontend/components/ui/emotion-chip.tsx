import React from 'react';

interface EmotionChipProps {
  emotion: string;
  selected?: boolean;
  onToggle?: () => void;
}

export function EmotionChip({ emotion, selected = false, onToggle }: EmotionChipProps) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
      }`}
    >
      {emotion}
    </button>
  );
}
