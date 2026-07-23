'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Sparkles, Brain, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-8 md:py-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-foreground">Safe Journal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your AI Journaling Companion
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Transform your thoughts into insights. Track your emotions, reflect with AI-powered guidance, and discover patterns in your mental wellness journey.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth/signup" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 gap-2">
                Start Your Journey
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="flex-1 sm:flex-none">
              Learn More
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover:scale-[1.03] duration-300 shadow-sm hover:shadow-md cursor-default">
              <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Private Journaling</h3>
              <p className="text-sm text-muted-foreground">
                Your thoughts are encrypted and completely private. Write freely without judgment.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-secondary/50 transition-all hover:scale-[1.03] duration-300 shadow-sm hover:shadow-md cursor-default">
              <div className="mb-4 inline-block p-3 bg-secondary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Reflections</h3>
              <p className="text-sm text-muted-foreground">
                Get thoughtful reflections and insights powered by advanced AI technology.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 transition-all hover:scale-[1.03] duration-300 shadow-sm hover:shadow-md cursor-default">
              <div className="mb-4 inline-block p-3 bg-accent/10 rounded-lg">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mood Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Visualize your emotional patterns and discover what influences your wellbeing.
              </p>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-8 border-t border-border">
            <Lock className="w-4 h-4" />
            <span>End-to-end encrypted. Your privacy is our priority.</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 md:px-8 md:py-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <p>&copy; 2024 Safe Journal. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
