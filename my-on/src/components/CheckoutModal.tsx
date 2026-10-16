import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, ArrowRight, ArrowLeft, Landmark, MapPin } from 'lucide-react';
import { Product, AdminSettings, formatPrice, ShippingDetails } from '../types';
import { createOrder } from '../dbService';

interface CheckoutModalProps {
  product: Product;
  color: string;
  size: string;
  quantity: number;
  adminSettings: AdminSettings;
  onClose: () => void;
  onOrderCompleted: () => void;
  selectedCountry: 'Nigeria' | 'Lebanon' | 'Egypt';
  onSelectCountry: (country: 'Nigeria' | 'Lebanon' | 'Egypt') => void;
}

export default function CheckoutModal({ 
  product, 
  color, 
  size, 
  quantity, 
  adminSettings, 
  onClose,
  onOrderCompleted,
  selectedCountry,
  onSelectCountry
}: CheckoutModalProps) {
  const shippingCountry = selectedCountry;
  const setShippingCountry = onSelectCountry;

  const [step, setStep] = useState<1 | 2>(1);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    fullName: '',
    phoneNumber: '',
    altPhoneNumber: '',
    email: '',
    country: selectedCountry,
    state: '',
    city: '',
    deliveryAddress: '',
    landmark: '',
    postalCode: '',
    deliveryNotes: ''
  });

  // Keep country in sync when user updates the shipping country prop
  useEffect(() => {
    setShippingDetails(prev => ({ ...prev, country: selectedCountry }));
  }, [selectedCountry]);

  const totalPrice = product.price * quantity;

  // Derive regional bank details based on the user's selected shipping country
  let bankName = adminSettings.nigeriaBankName || adminSettings.bankName || 'Zenith Bank PLC';
  let accountNumber = adminSettings.nigeriaAccountNumber || adminSettings.accountNumber || '1012345678';
  let accountName = adminSettings.nigeriaAccountName || adminSettings.accountName || 'my on limited';

  if (shippingCountry === 'Lebanon') {
    bankName = adminSettings.lebanonBankName || 'Bank Audi';
    accountNumber = adminSettings.lebanonAccountNumber || '9086868687';
    accountName = adminSettings.lebanonAccountName || 'my on limited';
  } else if (shippingCountry === 'Egypt') {
    bankName = adminSettings.egyptBankName || 'Commercial International Bank (CIB)';
    accountNumber = adminSettings.egyptAccountNumber || '100056789012';
    accountName = adminSettings.egyptAccountName || 'my on limited';
  }

  // Handle Drag & Drop / File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }
    
    setError('');
    setIsUploading(true);
    setScreenshotName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshot(event.target?.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    if (!shippingDetails.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!shippingDetails.phoneNumber.trim()) {
      setError('Phone Number is required.');
      return;
    }
    if (!shippingDetails.state.trim()) {
      setError('State / Province is required.');
      return;
    }
    if (!shippingDetails.city.trim()) {
      setError('City is required.');
      return;
    }
    if (!shippingDetails.deliveryAddress.trim()) {
      setError('Full Delivery Address is required.');
      return;
    }

    setError('');
    setStep(2);
  };

  const handleCompleteOrder = async () => {
    if (!screenshot) {
      setError('Please upload/attach a screenshot of your bank transfer to proceed.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const orderItems = [
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          color,
          size,
          quantity
        }
      ];

      // 1. Save to Supabase (and local storage fallback)
      await createOrder({
        items: orderItems,
        totalAmount: totalPrice,
        shippingCountry,
        shippingDetails,
        screenshotUrl: screenshot
      });

      // 2. Compose the elegant WhatsApp message
      const formattedMessage = `Hello *my on*, I would like to place an order:

*Product Details:*
• 1x ${product.name}
  - Colour: ${color}
  - Size: ${size}
  - Quantity: ${quantity}
  - Unit Price: ${formatPrice(product.price, shippingCountry)} (equivalent to $${product.price.toFixed(2)})

*Shipping Details:*
• Name: ${shippingDetails.fullName}
• Phone: ${shippingDetails.phoneNumber}
${shippingDetails.altPhoneNumber ? `• Alt Phone: ${shippingDetails.altPhoneNumber}\n` : ''}${shippingDetails.email ? `• Email: ${shippingDetails.email}\n` : ''}• Country: ${shippingDetails.country}
• State/Province: ${shippingDetails.state}
• City: ${shippingDetails.city}
• Delivery Address: ${shippingDetails.deliveryAddress}
${shippingDetails.landmark ? `• Landmark: ${shippingDetails.landmark}\n` : ''}${shippingDetails.postalCode ? `• Postal/ZIP: ${shippingDetails.postalCode}\n` : ''}${shippingDetails.deliveryNotes ? `• Notes: ${shippingDetails.deliveryNotes}\n` : ''}
*Financial Total:*
• Total Price: ${formatPrice(totalPrice, shippingCountry)} (equivalent to $${totalPrice.toFixed(2)})

_Note: I have attached my bank transfer payment screenshot to this conversation._`;

      const encodedText = encodeURIComponent(formattedMessage);
      // Sanitize the phone number to numbers only
      const cleanPhone = adminSettings.whatsappNumber.replace(/[^0-9+]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

      // Launch WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Fire complete callback
      onOrderCompleted();
    } catch (err: any) {
      setError('An error occurred while creating your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg overflow-hidden border border-zinc-200 shadow-2xl zara-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex flex-col">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-zinc-400">Checkout</span>
            <span className="font-serif text-lg tracking-wide uppercase text-black">
              {step === 1 ? 'Shipping Details' : 'Payment Settlement'}
            </span>
          </div>
          <button 
            id="close-checkout-btn"
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-black text-white' : 'bg-green-100 text-green-800'
              }`}>
                {step === 1 ? '1' : '✓'}
              </span>
              <span className={`text-[11px] uppercase tracking-wider font-medium ${
                step === 1 ? 'text-black' : 'text-zinc-400'
              }`}>Shipping</span>
            </div>
            <div className="h-px bg-zinc-200 flex-1 mx-4" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'
              }`}>
                2
              </span>
              <span className={`text-[11px] uppercase tracking-wider font-medium ${
                step === 2 ? 'text-black' : 'text-zinc-400'
              }`}>Payment & Proof</span>
            </div>
          </div>

          {step === 1 ? (
            /* STEP 1: SHIPPING DETAILS */
            <div className="space-y-4">
              
              <div className="bg-zinc-50 p-4 border border-zinc-100 flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Selected Item</h4>
                  <p className="text-xs font-semibold text-black uppercase mt-0.5">{product.name}</p>
                </div>
                <span className="text-xs font-semibold text-black">{formatPrice(totalPrice, shippingCountry)}</span>
              </div>

              {/* Shipping Country Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                  Shipping Destination Country *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Nigeria', 'Lebanon', 'Egypt'] as const).map((country) => {
                    const isSelected = shippingCountry === country;
                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => setShippingCountry(country)}
                        className={`py-2 text-[10px] uppercase tracking-wider font-semibold border text-center transition-all ${
                          isSelected 
                            ? 'border-black bg-black text-white' 
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                        }`}
                      >
                        {country}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={shippingDetails.fullName}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 801 234 5678"
                    value={shippingDetails.phoneNumber}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Alt Phone Number */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    Alternative Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. Secondary contact"
                    value={shippingDetails.altPhoneNumber}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, altPhoneNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. contact@example.com"
                    value={shippingDetails.email}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* State/Province */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lagos State"
                    value={shippingDetails.state}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ikeja"
                    value={shippingDetails.city}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                  Full Delivery Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street name, house/apartment number, etc."
                  value={shippingDetails.deliveryAddress}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Landmark */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite Chevron Station"
                    value={shippingDetails.landmark}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, landmark: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                    Postal / ZIP Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100001"
                    value={shippingDetails.postalCode}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">
                  Delivery Notes / Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please call before arriving"
                  value={shippingDetails.deliveryNotes}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, deliveryNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 focus:border-black outline-none transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 font-medium tracking-wide">
                  {error}
                </p>
              )}

            </div>
          ) : (
            /* STEP 2: BANK TRANSFER & PAYMENT SCREENSHOT */
            <div className="space-y-6">
              
              {/* Shipping details recap */}
              <div className="border border-zinc-100 bg-zinc-50 p-4 space-y-2">
                <div className="flex items-center space-x-1 text-black font-medium mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold">Delivery To:</span>
                </div>
                <div className="text-xs font-light text-zinc-700 space-y-1">
                  <p className="font-semibold text-black uppercase">{shippingDetails.fullName}</p>
                  <p>{shippingDetails.deliveryAddress}, {shippingDetails.city}, {shippingDetails.state}, {shippingDetails.country}</p>
                  <p className="text-[10px]">Contact: {shippingDetails.phoneNumber} {shippingDetails.altPhoneNumber && `| Alt: ${shippingDetails.altPhoneNumber}`}</p>
                </div>
              </div>

              {/* Bank Transfer Instructions */}
              <div className="border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center space-x-2 text-zinc-800">
                  <Landmark className="w-4 h-4 text-black" />
                  <h4 className="text-xs uppercase tracking-widest font-semibold">Bank Transfer Details</h4>
                </div>
                
                <div className="bg-zinc-50 p-3 rounded-xs border border-zinc-100 space-y-2 text-xs font-light">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Bank Name:</span>
                    <span className="font-medium text-black uppercase">{bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Account Number:</span>
                    <span className="font-mono font-medium text-black">{accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Account Name:</span>
                    <span className="font-medium text-black uppercase">{accountName}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-2 font-medium">
                    <span className="text-zinc-500">Amount Due:</span>
                    <span className="text-black text-sm">{formatPrice(totalPrice, shippingCountry)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-light leading-relaxed">
                  *Please transfer the exact amount above to our bank account. Once finished, upload a screenshot below.
                </p>
              </div>

              {/* Screenshot Upload (Drag and Drop / Selector) */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-zinc-400 font-medium">
                  Upload Payment Screenshot
                </label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xs p-6 text-center cursor-pointer transition-all ${
                    screenshot 
                      ? 'border-green-400 bg-green-50/20' 
                      : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50'
                  }`}
                  onClick={() => document.getElementById('screenshot-upload')?.click()}
                >
                  <input 
                    id="screenshot-upload"
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  
                  {isUploading ? (
                    <div className="space-y-2 text-zinc-500">
                      <div className="inline-block animate-spin w-6 h-6 border-2 border-t-black rounded-full" />
                      <p className="text-xs">Processing image...</p>
                    </div>
                  ) : screenshot ? (
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                      <p className="text-xs font-medium text-green-700">Screenshot Attached Successfully</p>
                      <p className="text-[10px] text-zinc-400 max-w-[250px] truncate">{screenshotName}</p>
                      <img 
                        src={screenshot} 
                        alt="Payment Screenshot Preview" 
                        className="w-24 h-32 object-cover border border-zinc-200 mt-2 shadow-xs"
                      />
                      <span className="text-[9px] text-zinc-400 underline mt-1">Tap to change image</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-8 h-8 text-zinc-400" />
                      <p className="text-xs text-zinc-600 font-medium">
                        Drag and drop your screenshot here, or <span className="underline">browse</span>
                      </p>
                      <p className="text-[9px] text-zinc-400">Supports PNG, JPG, JPEG</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 font-medium tracking-wide">
                  {error}
                </p>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          {step === 1 ? (
            <>
              <span className="text-xs font-semibold text-black uppercase">
                Total: {formatPrice(totalPrice, shippingCountry)}
              </span>
              <button
                id="next-step-btn"
                onClick={handleNextStep}
                className="px-6 py-3 bg-black text-white text-[11px] uppercase tracking-widest font-semibold flex items-center space-x-2 hover:bg-zinc-800 transition-colors"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                id="back-to-shipping-btn"
                onClick={() => setStep(1)}
                className="px-4 py-3 border border-zinc-200 text-zinc-700 bg-white text-[11px] uppercase tracking-widest font-semibold flex items-center space-x-1 hover:border-black hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                id="complete-order-submit-btn"
                disabled={isSubmitting}
                onClick={handleCompleteOrder}
                className="px-6 py-3 bg-black text-white text-[11px] uppercase tracking-widest font-semibold flex items-center space-x-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-3 h-3 border border-t-transparent rounded-full mr-1" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
