'use client';

import { BookOpen, Home, PenTool, BarChart3, Settings, LogOut, Brain, Heart, Sparkles, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: PenTool, label: 'New Entry', href: '/journal/new' },
  { icon: BookOpen, label: 'My Entries', href: '/journal' },
  { icon: Heart, label: 'Gratitude', href: '/gratitude' },
  { icon: Sparkles, label: 'Manifestation', href: '/manifestation' },
  { icon: Brain, label: 'AI Chat', href: '/ai-chat' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col justify-between overflow-hidden">
      {/* Decorative Landscapes (z-0 backdrop) */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-0 overflow-hidden h-40 select-none">
        {/* Sunset Orange */}
        <svg className="theme-illustration-sunset w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="190" cy="70" r="24" fill="currentColor" opacity="0.3" className="text-accent" />
          <path d="M-20 160 C 50 110, 110 140, 160 110 C 210 80, 250 110, 290 90 L 290 160 Z" fill="currentColor" opacity="0.15" className="text-primary" />
          <path d="M-20 160 C 40 130, 80 120, 130 140 C 180 160, 220 130, 290 150 L 290 160 Z" fill="currentColor" opacity="0.25" className="text-accent" />
          <path d="M 60 40 Q 65 35 70 40 Q 75 35 80 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary" opacity="0.4" />
          <path d="M 90 50 Q 93 46 96 50 Q 99 46 102 50" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-primary" opacity="0.3" />
        </svg>
        {/* Forest Green */}
        <svg className="theme-illustration-forest w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-20 160 C 60 120, 120 130, 180 110 C 220 95, 250 110, 290 100 L 290 160 Z" fill="currentColor" opacity="0.15" className="text-accent" />
          <polygon points="40,130 30,150 50,150" fill="currentColor" opacity="0.2" className="text-primary" />
          <polygon points="40,115 33,132 47,132" fill="currentColor" opacity="0.2" className="text-primary" />
          <polygon points="40,102 36,118 44,118" fill="currentColor" opacity="0.2" className="text-primary" />
          <polygon points="90,140 82,158 98,158" fill="currentColor" opacity="0.3" className="text-primary" />
          <polygon points="90,126 84,142 96,142" fill="currentColor" opacity="0.3" className="text-primary" />
          <polygon points="180,125 172,145 188,145" fill="currentColor" opacity="0.25" className="text-accent" />
          <polygon points="180,112 175,127 185,127" fill="currentColor" opacity="0.25" className="text-accent" />
          <path d="M-20 160 C 40 140, 90 145, 150 135 C 200 125, 240 145, 290 135 L 290 160 Z" fill="currentColor" opacity="0.25" className="text-primary" />
        </svg>
        {/* Ocean Blue */}
        <svg className="theme-illustration-ocean w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-20 130 Q 30 110 80 130 T 180 130 T 290 130 L 290 160 L -20 160 Z" fill="currentColor" opacity="0.15" className="text-primary" />
          <path d="M-20 140 Q 40 125 90 145 T 190 135 T 290 145 L 290 160 L -20 160 Z" fill="currentColor" opacity="0.2" className="text-accent" />
          <path d="M-20 150 Q 50 140 100 150 T 200 145 T 290 150 L 290 160 L -20 160 Z" fill="currentColor" opacity="0.3" className="text-primary" />
        </svg>
        {/* Lavender Bloom */}
        <svg className="theme-illustration-lavender w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-20 160 C 50 130, 110 145, 160 125 C 210 105, 250 120, 290 110 L 290 160 Z" fill="currentColor" opacity="0.15" className="text-accent" />
          <path d="M30 150 Q 28 120 32 90" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity="0.3" />
          <circle cx="32" cy="90" r="3" fill="currentColor" className="text-accent" opacity="0.4" />
          <circle cx="30" cy="98" r="2.5" fill="currentColor" className="text-accent" opacity="0.4" />
          <circle cx="34" cy="106" r="2.5" fill="currentColor" className="text-accent" opacity="0.4" />
          <circle cx="28" cy="114" r="2" fill="currentColor" className="text-primary" opacity="0.3" />
          <path d="M70 160 Q 75 130 72 100" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity="0.3" />
          <circle cx="72" cy="100" r="3" fill="currentColor" className="text-accent" opacity="0.4" />
          <circle cx="75" cy="108" r="2.5" fill="currentColor" className="text-accent" opacity="0.4" />
          <path d="M180 150 Q 178 125 182 95" stroke="currentColor" strokeWidth="1.5" className="text-accent" opacity="0.3" />
          <circle cx="182" cy="95" r="3.5" fill="currentColor" className="text-primary" opacity="0.4" />
          <circle cx="180" cy="103" r="3" fill="currentColor" className="text-primary" opacity="0.4" />
          <path d="M-20 160 C 40 145, 90 150, 150 140 C 200 130, 240 150, 290 140 L 290 160 Z" fill="currentColor" opacity="0.25" className="text-primary" />
        </svg>
        {/* Sakura Pink */}
        <svg className="theme-illustration-sakura w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M256 20 Q 210 25 180 40 T 130 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-accent" opacity="0.3" />
          <path d="M200 32 Q 185 45 180 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" opacity="0.2" />
          <circle cx="180" cy="40" r="5" fill="currentColor" className="text-primary" opacity="0.4" />
          <circle cx="130" cy="55" r="4" fill="currentColor" className="text-primary" opacity="0.4" />
          <circle cx="195" cy="30" r="5" fill="currentColor" className="text-primary" opacity="0.4" />
          <circle cx="180" cy="60" r="4.5" fill="currentColor" className="text-accent" opacity="0.4" />
          <path d="M60 80 Q 55 90 50 100" stroke="currentColor" strokeWidth="1" className="text-primary" opacity="0.3" />
          <path d="M120 100 Q 112 115 105 130" stroke="currentColor" strokeWidth="1.2" className="text-primary" opacity="0.3" />
          <path d="M-20 160 C 50 140, 120 150, 290 135 L 290 160 Z" fill="currentColor" opacity="0.15" className="text-primary" />
        </svg>
        {/* Autumn Leaves */}
        <svg className="theme-illustration-autumn w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-20 30 Q 30 25 60 40 T 110 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" opacity="0.3" />
          <path d="M 60 40 C 58 35, 52 38, 55 45 C 58 48, 65 44, 60 40" fill="currentColor" className="text-primary" opacity="0.4" />
          <path d="M 100 80 C 95 82, 92 88, 97 92 C 102 96, 105 90, 100 80" fill="currentColor" className="text-primary" opacity="0.3" />
          <path d="M 170 100 C 165 103, 162 109, 167 113 C 172 117, 175 111, 170 100" fill="currentColor" className="text-accent" opacity="0.4" />
          <path d="M-20 160 C 50 130, 110 145, 290 115 L 290 160 Z" fill="currentColor" opacity="0.15" className="text-accent" />
          <path d="M-20 160 C 40 145, 90 150, 290 135 L 290 160 Z" fill="currentColor" opacity="0.25" className="text-primary" />
        </svg>
        {/* Mint Fresh */}
        <svg className="theme-illustration-mint w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-10 170 Q 30 110 90 90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" opacity="0.2" />
          <path d="M15 130 Q 35 115 50 95" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity="0.15" />
          <path d="M40 145 Q 60 135 70 120" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity="0.15" />
          <path d="M-20 160 Q 40 130 110 130" stroke="currentColor" strokeWidth="2" className="text-accent" opacity="0.2" />
          <path d="M-20 160 C 50 140, 120 145, 290 135 L 290 160 Z" fill="currentColor" opacity="0.15" className="text-primary" />
        </svg>
        {/* Midnight Sky */}
        <svg className="theme-illustration-midnight w-full h-full" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="1" fill="currentColor" className="text-primary" opacity="0.5" />
          <circle cx="85" cy="50" r="1.2" fill="currentColor" className="text-primary" opacity="0.6" />
          <circle cx="150" cy="25" r="1" fill="currentColor" className="text-primary" opacity="0.4" />
          <circle cx="210" cy="40" r="1.5" fill="currentColor" className="text-accent" opacity="0.6" />
          <path d="M 180 20 A 12 12 0 1 0 192 32 A 10 10 0 1 1 180 20" fill="currentColor" className="text-accent" opacity="0.4" />
          <path d="M -20 90 Q 50 50 120 80 T 290 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" className="text-primary" opacity="0.15" />
          <path d="M -20 105 Q 60 65 130 95 T 290 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" className="text-accent" opacity="0.1" />
          <path d="M-20 160 L 40 120 L 100 145 L 180 110 L 240 135 L 290 115 L 290 160 Z" fill="currentColor" opacity="0.2" className="text-primary" />
        </svg>
      </div>

      <div className="flex flex-col flex-1 relative z-10 w-full h-full justify-between">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-sidebar-border">
            <BookOpen className="w-6 h-6 text-sidebar-primary" />
            <span className="text-lg font-bold text-sidebar-foreground">Safe Journal</span>
          </div>

          {/* Nav Items */}
          <nav className="px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {/* Logout Button */}
          <div className="px-4 py-6 border-t border-sidebar-border">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full gap-2 text-destructive hover:bg-sidebar-accent hover:text-destructive border-sidebar-border relative z-10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
