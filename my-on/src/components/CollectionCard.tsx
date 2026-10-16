import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CollectionCardProps {
  key?: string | number;
  title: string;
  subtitle: string;
  bannerPath: string;
  onSelect: () => void;
}

export default function CollectionCard({ title, subtitle, bannerPath, onSelect }: CollectionCardProps) {
  return (
    <div 
      onClick={onSelect}
      className="group relative h-[65vh] sm:h-[80vh] w-full overflow-hidden bg-zinc-100 cursor-pointer border border-zinc-100 shadow-sm"
    >
      {/* Background Image */}
      <img
        src={bannerPath}
        alt={title}
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover object-center transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-105"
      />

      {/* Elegant Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500 group-hover:opacity-70" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12 flex flex-col items-start justify-end text-white">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide mb-4">
          {title}
        </h2>
        
        {/* Zara style minimalist CTA line */}
        <div className="flex items-center space-x-2 border-b border-white/40 pb-1 text-xs uppercase tracking-[0.2em] font-medium hover:border-white transition-colors duration-300">
          <span>Discover Collection</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
