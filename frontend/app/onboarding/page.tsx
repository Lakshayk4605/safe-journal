'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Brain, Lock, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const slides = [
  {
    icon: BookOpen,
    title: 'Welcome to Safe Journal',
    description:
      'Your private space to express thoughts, feelings, and experiences without judgment.',
    color: 'from-primary',
  },
  {
    icon: Lock,
    title: 'Your Privacy Matters',
    description:
      'All your entries are end-to-end encrypted. Only you can access your thoughts.',
    color: 'from-secondary',
  },
  {
    icon: Brain,
    title: 'Track Your Emotions',
    description:
      'Log your mood and emotions daily to discover patterns in your wellbeing.',
    color: 'from-cyan-500',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    description: 'Receive thoughtful reflections and personalized suggestions based on your entries.',
    color: 'from-accent',
  },
  {
    icon: Heart,
    title: 'Mental Wellness First',
    description:
      "We're designed with your mental health in mind. Your wellbeing is our priority.",
    color: 'from-rose-500',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-12">
        {/* Skip button */}
        <div className="flex justify-between items-center">
          <div />
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8 text-center animate-fade-in">
          {/* Icon */}
          <div className={`inline-block p-6 rounded-full bg-gradient-to-br ${slide.color} to-secondary/20 text-white`}>
            <Icon className="w-12 h-12" />
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">{slide.title}</h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">{slide.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-center pt-8">
          <Button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            variant="outline"
            className="px-8"
          >
            Previous
          </Button>
          <Button onClick={handleNext} className="px-8 gap-2 bg-primary hover:bg-primary/90">
            {currentSlide === slides.length - 1 ? (
              <>
                Get Started
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Slide counter */}
        <p className="text-center text-sm text-muted-foreground">
          {currentSlide + 1} of {slides.length}
        </p>
      </div>
    </div>
  );
}
