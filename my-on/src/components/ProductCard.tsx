import React from 'react';
import { Product, formatPrice } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  selectedCountry?: 'Nigeria' | 'Lebanon' | 'Egypt';
  key?: any;
}

export default function ProductCard({ product, onSelect, selectedCountry = 'Nigeria' }: ProductCardProps) {
  const coverImage = product.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';
  const hoverImage = product.images?.[1] || coverImage;

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group flex flex-col cursor-pointer bg-white zara-fade-in"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-50 border border-zinc-100">
        <img
          src={coverImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-all duration-1000 group-hover:hidden"
        />
        <img
          src={hoverImage}
          alt={`${product.name} Alternate`}
          referrerPolicy="no-referrer"
          className="hidden h-full w-full object-cover object-center transition-all duration-1000 group-hover:block group-hover:scale-102"
        />

        {/* Stock Status Badge */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium border border-black/80 px-4 py-2 bg-white text-black">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="mt-4 flex flex-col space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="text-xs sm:text-sm text-zinc-900 font-light uppercase tracking-wider group-hover:text-zinc-600 transition-colors">
            {product.name}
          </h3>
          <span className="text-xs sm:text-sm font-medium text-black">
            {formatPrice(product.price, selectedCountry)}
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 font-light uppercase tracking-[0.15em]">
          {product.collection}
        </p>
      </div>
    </div>
  );
}
