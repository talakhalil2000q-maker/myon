export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  collection: 'Egypt Rose Collection' | 'Signature Collection' | 'Essential Collection';
  images: string[];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  createdAt: number;
  displayOrder?: number;
}

export interface Collection {
  id: 'Egypt Rose Collection' | 'Signature Collection' | 'Essential Collection';
  name: string;
  subtitle: string;
  bannerKey: 'egyptRoseBanner' | 'signatureBanner' | 'essentialBanner';
  displayOrder: number;
}

export interface AdminSettings {
  adminPasscode: string;
  whatsappNumber: string;
  egyptRoseBanner: string;
  signatureBanner: string;
  essentialBanner: string;
  
  // Nigeria account
  nigeriaBankName: string;
  nigeriaAccountNumber: string;
  nigeriaAccountName: string;
  
  // Lebanon account
  lebanonBankName: string;
  lebanonAccountNumber: string;
  lebanonAccountName: string;
  
  // Egypt account
  egyptBankName: string;
  egyptAccountNumber: string;
  egyptAccountName: string;

  // Keep legacy fields to avoid type or compatibility issues with existing documents
  bankName?: string;
  accountNumber?: string;
  accountName?: string;

  // Dynamic collection order settings
  collections?: Collection[];
}

export interface OrderInput {
  product: Product;
  color: string;
  size: string;
  quantity: number;
  shippingCountry: 'Nigeria' | 'Lebanon' | 'Egypt';
  screenshotBase64?: string;
}

export interface ShippingDetails {
  fullName: string;
  phoneNumber: string;
  altPhoneNumber?: string;
  email?: string;
  country: string;
  state: string;
  city: string;
  deliveryAddress: string;
  landmark?: string;
  postalCode?: string;
  deliveryNotes?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  shippingCountry: 'Nigeria' | 'Lebanon' | 'Egypt';
  shippingDetails: ShippingDetails;
  screenshotUrl?: string;
  status: OrderStatus;
  createdAt: number;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  name: string;
  flag: string;
}

export const CURRENCIES: Record<'Nigeria' | 'Lebanon' | 'Egypt', CurrencyConfig> = {
  Nigeria: {
    code: 'NGN',
    symbol: '₦',
    rate: 1500,
    name: 'Naira',
    flag: '🇳🇬'
  },
  Lebanon: {
    code: 'LBP',
    symbol: 'L.L.',
    rate: 90000,
    name: 'Lebanese Pound',
    flag: '🇱🇧'
  },
  Egypt: {
    code: 'EGP',
    symbol: 'E£',
    rate: 48,
    name: 'Egyptian Pound',
    flag: '🇪🇬'
  }
};

export function formatPrice(usdPrice: number, country: 'Nigeria' | 'Lebanon' | 'Egypt'): string {
  const config = CURRENCIES[country];
  const converted = usdPrice * config.rate;
  
  // Format with thousands separator
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: country === 'Lebanon' ? 0 : 2,
    maximumFractionDigits: country === 'Lebanon' ? 0 : 2,
  }).format(converted);
  
  return `${config.symbol}${formatted}`;
}
