import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import { Product, formatPrice } from '../types';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onOrder: (color: string, size: string, quantity: number) => void;
  selectedCountry?: 'Nigeria' | 'Lebanon' | 'Egypt';
}

export default function ProductDetail({ product, onBack, onOrder, selectedCountry = 'Nigeria' }: ProductDetailProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  // Reset states when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedColor(product.colors[0] || '');
    setSelectedSize(product.sizes[0] || '');
    setQuantity(1);
    setError('');
  }, [product]);

  const handleNextImage = () => {
    if (product.images.length > 0) {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const handlePrevImage = () => {
    if (product.images.length > 0) {
      setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleOrderSubmit = () => {
    if (!product.inStock) {
      setError('This product is currently out of stock.');
      return;
    }
    if (!selectedColor) {
      setError('Please select a colour.');
      return;
    }
    if (!selectedSize) {
      setError('Please select a size.');
      return;
    }
    setError('');
    onOrder(selectedColor, selectedSize, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 zara-fade-in">
      {/* Back Button */}
      <button
        id="detail-back-btn"
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-black transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to collection</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left Column: Product Image Gallery */}
        <div className="flex flex-col space-y-4">
          <div className="relative aspect-[3/4] w-full bg-zinc-50 overflow-hidden border border-zinc-100">
            {product.images.length > 0 ? (
              <img
                src={product.images[activeImageIndex]}
                alt={`${product.name} View ${activeImageIndex + 1}`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center transition-all duration-500"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-300">
                No Image Available
              </div>
            )}

            {/* Sold Out Overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-xs uppercase tracking-[0.25em] font-medium border border-black px-6 py-3 bg-white text-black">
                  Sold Out
                </span>
              </div>
            )}

            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  id="prev-image-btn"
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 text-zinc-800 hover:bg-white hover:text-black transition-all border border-zinc-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="next-image-btn"
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 text-zinc-800 hover:bg-white hover:text-black transition-all border border-zinc-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Indicator Dots */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 bg-black/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === activeImageIndex ? 'bg-black w-3' : 'bg-zinc-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-[3/4] overflow-hidden border bg-zinc-50 ${
                    idx === activeImageIndex ? 'border-black' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <img
                    src={img}
                    alt="Thumbnail"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Detail & Order Panel */}
        <div className="flex flex-col space-y-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium">
              {product.collection}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-zinc-900 tracking-wide mt-1 uppercase">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline">
              <span className="text-xl font-medium text-black">{formatPrice(product.price, selectedCountry)}</span>
            </div>
          </div>

          <hr className="border-zinc-100" />

          {/* Description */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3">Description</h3>
            <p className="text-sm font-light text-zinc-600 leading-relaxed max-w-lg">
              {product.description}
            </p>
          </div>

          {/* Colors Selection */}
          {product.colors.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3">
                Colour: <span className="text-black font-semibold uppercase text-[11px] ml-1">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => { setSelectedColor(color); setError(''); }}
                      className={`text-[11px] uppercase tracking-wider font-medium px-4 py-2 border transition-all ${
                        isSelected 
                          ? 'border-black bg-black text-white font-semibold' 
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes Selection */}
          {product.sizes.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3">
                Size: <span className="text-black font-semibold uppercase text-[11px] ml-1">{selectedSize}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setError(''); }}
                      className={`min-w-[44px] h-[40px] text-xs font-medium border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-black bg-black text-white font-semibold' 
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3">Quantity</h3>
            <div className="flex items-center space-x-1">
              <button
                id="quantity-decrease-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 text-lg transition-colors"
                disabled={!product.inStock}
              >
                -
              </button>
              <div className="w-12 h-10 border-t border-b border-zinc-200 flex items-center justify-center text-sm font-semibold">
                {quantity}
              </div>
              <button
                id="quantity-increase-btn"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 text-lg transition-colors"
                disabled={!product.inStock}
              >
                +
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-600 font-medium tracking-wide">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="pt-4 flex flex-col space-y-3">
            <button
              id="order-now-submit-btn"
              onClick={handleOrderSubmit}
              disabled={!product.inStock}
              className={`w-full py-4 text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 ${
                product.inStock
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
              }`}
            >
              {product.inStock ? 'Order Now' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
