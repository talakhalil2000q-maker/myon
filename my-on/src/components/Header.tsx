import React from 'react';
import { ShoppingBag, Lock, Sparkles, Globe } from 'lucide-react';

interface HeaderProps {
  onNavigate: (view: 'home' | 'collection' | 'detail' | 'admin', targetCollection?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  currentView: string;
  selectedCountry: 'Nigeria' | 'Lebanon' | 'Egypt';
  onSelectCountry: (country: 'Nigeria' | 'Lebanon' | 'Egypt') => void;
}

export default function Header({ 
  onNavigate, 
  cartCount, 
  onOpenCart, 
  currentView,
  selectedCountry,
  onSelectCountry
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Navigation Links & Country/Currency Select */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <button 
            id="nav-home-btn"
            onClick={() => onNavigate('home')}
            className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors hover:text-black ${
              currentView === 'home' ? 'text-black font-semibold' : 'text-zinc-400'
            }`}
          >
            Collections
          </button>

          <div className="h-4 w-px bg-zinc-200 block" />

          {/* Premium Selector */}
          <div className="flex items-center space-x-1 border border-zinc-100 px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 transition-colors">
            <Globe className="w-3 h-3 text-zinc-400" />
            <select
              id="header-country-selector"
              value={selectedCountry}
              onChange={(e) => onSelectCountry(e.target.value as 'Nigeria' | 'Lebanon' | 'Egypt')}
              className="bg-transparent text-[9px] uppercase tracking-widest font-semibold text-zinc-600 hover:text-black focus:outline-none cursor-pointer select-none border-none outline-none py-0.5"
            >
              <option value="Nigeria">🇳🇬 NGN (₦)</option>
              <option value="Lebanon">🇱🇧 LBP (L.L.)</option>
              <option value="Egypt">🇪🇬 EGP (E£)</option>
            </select>
          </div>
        </div>

        {/* Center: Brand Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button 
            id="brand-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <span className="font-display text-2xl font-light tracking-[0.35em] uppercase text-black transition-all duration-300 group-hover:tracking-[0.45em]">
              my on
            </span>
            <span className="text-[7px] uppercase tracking-[0.5em] text-zinc-400 -mt-0.5 group-hover:text-black transition-colors">
              luxury apparel
            </span>
          </button>
        </div>

        {/* Right Side: Bag and Owner Portal */}
        <div className="flex items-center space-x-4">
          <button
            id="nav-admin-btn"
            onClick={() => onNavigate('admin')}
            className={`p-2 transition-colors duration-200 flex items-center space-x-1 border border-transparent hover:border-zinc-200 rounded-full ${
              currentView === 'admin' ? 'text-black bg-zinc-50' : 'text-zinc-500 hover:text-black'
            }`}
            title="Owner Portal"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-medium">Owner</span>
          </button>

          <button
            id="cart-toggle-btn"
            onClick={onOpenCart}
            className="relative p-2 text-zinc-500 hover:text-black transition-colors border border-transparent hover:border-zinc-200 rounded-full"
            title="Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
