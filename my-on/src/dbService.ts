import { supabase } from './supabase';
import { Product, AdminSettings, Collection, Order, OrderStatus } from './types';

const ADMIN_DOC_ID = 'admin_settings';

// Default initial admin settings
const DEFAULT_SETTINGS: AdminSettings = {
  adminPasscode: 'myonadmin',
  whatsappNumber: '+234 908 686 8687', // Redirection phone number
  egyptRoseBanner: '/egypt_rose_banner.jpg',
  signatureBanner: '/signature_banner.jpg',
  essentialBanner: '/essential_banner.jpg',
  
  // Nigeria account
  nigeriaBankName: 'Zenith Bank PLC',
  nigeriaAccountNumber: '1012345678',
  nigeriaAccountName: 'my on limited',

  // Lebanon account
  lebanonBankName: 'Bank Audi',
  lebanonAccountNumber: '9086868687',
  lebanonAccountName: 'my on limited',

  // Egypt account
  egyptBankName: 'Commercial International Bank (CIB)',
  egyptAccountNumber: '100056789012',
  egyptAccountName: 'my on limited',

  // Legacy fallback fields for compatibility
  bankName: 'Zenith Bank PLC',
  accountNumber: '1012345678',
  accountName: 'my on limited',

  // Default collection order config
  collections: [
    {
      id: 'Egypt Rose Collection',
      name: 'Egypt Rose',
      subtitle: 'Collection 01 / Linen & Silk',
      bannerKey: 'egyptRoseBanner',
      displayOrder: 1
    },
    {
      id: 'Signature Collection',
      name: 'Signature',
      subtitle: 'Collection 02 / Asymmetric Silhouette',
      bannerKey: 'signatureBanner',
      displayOrder: 2
    },
    {
      id: 'Essential Collection',
      name: 'Essential',
      subtitle: 'Collection 03 / Timeless Basics',
      bannerKey: 'essentialBanner',
      displayOrder: 3
    }
  ]
};

// In-memory caching variables to avoid duplicate database queries in a session
let memorySettings: AdminSettings | null = null;
let memoryProducts: Product[] | null = null;

// Initial premium products for seeding
const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: "Linen Rose Wrap Dress",
    price: 145,
    description: "Emanate effortless elegance in this lightweight linen wrap dress, tailored with a cascading rose drape and custom tie waist. Crafted from 100% Belgian flax linen, it offers breathable luxury designed for premium comfort.",
    collection: "Egypt Rose Collection",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop"
    ],
    colors: ["Ivory", "Blush Rose", "Soft Sage"],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    createdAt: Date.now() - 100000,
    displayOrder: 1
  },
  {
    name: "Desert Rose Tailored Blazer",
    price: 185,
    description: "A clean-lined, structured blazer in a soft terracotta hue. Features peak lapels, a single-breasted horn button closure, and subtle shoulder structure for a highly refined Zara-style silhouette.",
    collection: "Egypt Rose Collection",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop"
    ],
    colors: ["Terracotta", "Sand", "Midnight Black"],
    sizes: ["S", "M", "L"],
    inStock: true,
    createdAt: Date.now() - 90000,
    displayOrder: 2
  },
  {
    name: "Nile Silk Slip Dress",
    price: 160,
    description: "Cut on the bias for a fluid, flattering drape, this luxurious silk midi dress features a classic cowl neck and adjustable cross-back straps. Designed to embody quiet, timeless luxury.",
    collection: "Egypt Rose Collection",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop"
    ],
    colors: ["Rosewood", "Nile Bronze", "Onyx Black"],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    createdAt: Date.now() - 80000,
    displayOrder: 3
  },
  {
    name: "Monochrome Asymmetric Coat",
    price: 290,
    description: "An exquisite statement outerwear piece from our Signature label. Designed with an oversized drape collar, dramatic asymmetric wrap closure, and deep welt pockets. Crafted from heavy virgin wool blend.",
    collection: "Signature Collection",
    images: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop"
    ],
    colors: ["Midnight Black", "Slate Grey"],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    createdAt: Date.now() - 70000,
    displayOrder: 1
  },
  {
    name: "Draped Satin Trench",
    price: 220,
    description: "A fluid interpretation of the classic trench coat, made from high-density heavy satin that drapes beautifully. Features storm flaps, relaxed epaulets, and a detachable fabric tie-belt.",
    collection: "Signature Collection",
    images: [
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&auto=format&fit=crop"
    ],
    colors: ["Oyster Sand", "Sage Green", "Noir Black"],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    createdAt: Date.now() - 60000,
    displayOrder: 2
  },
  {
    name: "Structured Tailored Pants",
    price: 130,
    description: "High-waisted tailored pants with structured double front pleats and a relaxed wide-leg silhouette. Finished with a concealed zip fly and adjustable side waist tabs for a perfect fit.",
    collection: "Signature Collection",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop"
    ],
    colors: ["Charcoal", "Ivory White", "Jet Black"],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    createdAt: Date.now() - 50000,
    displayOrder: 3
  },
  {
    name: "Classic Poplin Shirt",
    price: 85,
    description: "The absolute wardrobe essential. An oversized boyfriend-style button-up shirt crafted from crisp organic cotton poplin. Features classic tall cuffs, curved side hems, and elegant mother-of-pearl buttons.",
    collection: "Essential Collection",
    images: [
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=800&auto=format&fit=crop"
    ],
    colors: ["Optic White", "Sky Blue", "Striped Azure"],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    createdAt: Date.now() - 40000,
    displayOrder: 1
  },
  {
    name: "Ribbed Mock-Neck Knit",
    price: 75,
    description: "A form-fitting mock-neck sweater top in lightweight, breathable ribbed cotton-modal knit. Seamless feel designed to sculpt and layer perfectly for any climate.",
    collection: "Essential Collection",
    images: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop"
    ],
    colors: ["Cream Beige", "Muted Olive", "Espresso Brown"],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    createdAt: Date.now() - 30000,
    displayOrder: 2
  }
];

const LOCAL_PRODUCTS_KEY = 'my_on_local_products';
const LOCAL_SETTINGS_KEY = 'my_on_local_settings';

/**
 * Helper to convert base64 to Blob for uploading to Supabase Storage.
 */
function base64ToBlob(base64Str: string): { blob: Blob, mimeType: string } {
  const parts = base64Str.split(';base64,');
  const mimeType = parts[0].split(':')[1];
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return {
    blob: new Blob([byteArray], { type: mimeType }),
    mimeType
  };
}

/**
 * Helper to upload a single base64 image string or file to Supabase Storage.
 * Returns the download URL string. If already a URL, returns it directly.
 */
export async function uploadImageToStorage(base64Str: string, folder = 'products'): Promise<string> {
  if (!base64Str.startsWith('data:image/')) {
    return base64Str;
  }

  if (!supabase) {
    console.log('Supabase not configured. Using base64 string directly for image.');
    return base64Str;
  }

  try {
    const { blob, mimeType } = base64ToBlob(base64Str);
    const format = mimeType.split('/')[1] || 'png';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${format}`;

    const { error } = await supabase.storage
      .from('products')
      .upload(filename, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('Error uploading image to Supabase Storage:', error.message);
      console.warn('Falling back to direct Base64 string.');
      return base64Str;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (err) {
    console.error('Image processing/upload failed:', err);
    return base64Str;
  }
}

/**
 * Fetch general settings. If none exist, initializes with default settings.
 */
export async function getAdminSettings(forceRefresh = false): Promise<AdminSettings> {
  if (memorySettings && !forceRefresh) {
    return memorySettings;
  }

  if (!supabase) {
    const cached = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        memorySettings = { ...DEFAULT_SETTINGS, ...parsed };
        return memorySettings;
      } catch (e) {
        console.error('Failed to parse cached settings:', e);
      }
    }
    memorySettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', ADMIN_DOC_ID)
      .maybeSingle();

    if (error) {
      console.warn('Notice: Error fetching settings from Supabase. The "settings" table might not be created yet. Falling back to default settings.', error);
      throw error;
    }

    if (data) {
      const merged = { ...DEFAULT_SETTINGS, ...data };
      memorySettings = merged;
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    } else {
      // Seed default settings if empty
      const { error: insertError } = await supabase
        .from('settings')
        .insert({ id: ADMIN_DOC_ID, ...DEFAULT_SETTINGS });

      if (insertError) {
        console.warn('Notice: Error seeding settings in Supabase. Ensure table structure matches default fields.', insertError);
      }
      memorySettings = DEFAULT_SETTINGS;
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.warn('Supabase settings query failed, returning local cache:', error);
    const cached = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to database
 */
export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  let egyptRoseBanner = settings.egyptRoseBanner;
  let signatureBanner = settings.signatureBanner;
  let essentialBanner = settings.essentialBanner;

  try {
    const uploadTasks: Promise<string>[] = [];
    const fields: ('egyptRoseBanner' | 'signatureBanner' | 'essentialBanner')[] = [];

    if (egyptRoseBanner && egyptRoseBanner.startsWith('data:image/')) {
      uploadTasks.push(uploadImageToStorage(egyptRoseBanner, 'banners'));
      fields.push('egyptRoseBanner');
    }
    if (signatureBanner && signatureBanner.startsWith('data:image/')) {
      uploadTasks.push(uploadImageToStorage(signatureBanner, 'banners'));
      fields.push('signatureBanner');
    }
    if (essentialBanner && essentialBanner.startsWith('data:image/')) {
      uploadTasks.push(uploadImageToStorage(essentialBanner, 'banners'));
      fields.push('essentialBanner');
    }

    if (uploadTasks.length > 0) {
      const uploadedUrls = await Promise.all(uploadTasks);
      fields.forEach((field, index) => {
        if (field === 'egyptRoseBanner') egyptRoseBanner = uploadedUrls[index];
        else if (field === 'signatureBanner') signatureBanner = uploadedUrls[index];
        else if (field === 'essentialBanner') essentialBanner = uploadedUrls[index];
      });
    }
  } catch (uploadError) {
    console.error('Failed to upload banner images:', uploadError);
  }

  const updatedSettings: AdminSettings = {
    ...settings,
    egyptRoseBanner,
    signatureBanner,
    essentialBanner
  };

  memorySettings = updatedSettings;
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updatedSettings));

  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: ADMIN_DOC_ID, ...updatedSettings });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Supabase save settings error:', error);
    throw new Error('Failed to save settings permanently to Supabase.');
  }
}

/**
 * Fetch all products, sorted by createdAt descending
 */
export async function getProducts(forceRefresh = false): Promise<Product[]> {
  if (memoryProducts && !forceRefresh) {
    return memoryProducts;
  }

  if (!supabase) {
    const cached = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.sort((a: any, b: any) => {
          if (a.displayOrder !== b.displayOrder) {
            return (a.displayOrder || 0) - (b.displayOrder || 0);
          }
          return b.createdAt - a.createdAt;
        });
        memoryProducts = parsed;
        return parsed;
      } catch (e) {
        console.error('Failed to parse cached products:', e);
      }
    }
    const fallbackProducts = SEED_PRODUCTS.map((p, index) => ({
      id: `fallback-${index}`,
      ...p
    } as Product));
    fallbackProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return b.createdAt - a.createdAt;
    });
    memoryProducts = fallbackProducts;
    return fallbackProducts;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('displayOrder', { ascending: true });

    if (error) {
      console.warn('Notice: Error fetching products from Supabase. The "products" table might not be created yet. Falling back to local state.', error);
      throw error;
    }

    if (data && data.length > 0) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        description: item.description,
        collection: item.collection,
        images: Array.isArray(item.images) ? item.images : [],
        colors: Array.isArray(item.colors) ? item.colors : [],
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        inStock: item.inStock,
        createdAt: Number(item.createdAt),
        displayOrder: item.displayOrder !== undefined && item.displayOrder !== null ? Number(item.displayOrder) : 0
      })) as Product[];

      // Secondary sorting in JS for absolute guarantee
      mapped.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return b.createdAt - a.createdAt;
      });

      memoryProducts = mapped;
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(mapped));
      return mapped;
    } else {
      // Database is empty. Seed initial products.
      console.log('Database empty. Seeding initial products...');
      const seeded: Product[] = [];
      for (const p of SEED_PRODUCTS) {
        const { data: inserted, error: insertErr } = await supabase
          .from('products')
          .insert({
            name: p.name,
            price: p.price,
            description: p.description,
            collection: p.collection,
            images: p.images,
            colors: p.colors,
            sizes: p.sizes,
            inStock: p.inStock,
            createdAt: p.createdAt,
            displayOrder: p.displayOrder
          })
          .select()
          .single();

        if (insertErr) {
          console.warn('Notice: Failed to seed product in Supabase. This may be due to missing table or columns.', insertErr);
        } else if (inserted) {
          seeded.push({
            id: inserted.id,
            name: inserted.name,
            price: Number(inserted.price),
            description: inserted.description,
            collection: inserted.collection,
            images: inserted.images,
            colors: inserted.colors,
            sizes: inserted.sizes,
            inStock: inserted.inStock,
            createdAt: Number(inserted.createdAt),
            displayOrder: inserted.displayOrder !== undefined && inserted.displayOrder !== null ? Number(inserted.displayOrder) : 0
          } as Product);
        }
      }
      const finalProducts = seeded;
      finalProducts.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return b.createdAt - a.createdAt;
      });
      memoryProducts = finalProducts;
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(finalProducts));
      return finalProducts;
    }
  } catch (error) {
    console.warn('Error fetching products from Supabase, falling back to cache:', error);
    const cached = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.sort((a: any, b: any) => {
          if (a.displayOrder !== b.displayOrder) {
            return (a.displayOrder || 0) - (b.displayOrder || 0);
          }
          return b.createdAt - a.createdAt;
        });
        memoryProducts = parsed;
        return parsed;
      } catch (e) {
        console.error('LocalStorage read error:', e);
      }
    }
    const fallbackProducts = SEED_PRODUCTS.map((p, index) => ({
      id: `fallback-${index}`,
      ...p
    } as Product));
    fallbackProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return b.createdAt - a.createdAt;
    });
    memoryProducts = fallbackProducts;
    return fallbackProducts;
  }
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'displayOrder'>): Promise<Product> {
  let imageUrls: string[] = [];
  try {
    imageUrls = await Promise.all(
      product.images.map(async (img) => {
        if (img.startsWith('data:image/')) {
          try {
            return await uploadImageToStorage(img, 'products');
          } catch (err) {
            console.warn('Notice: Individual image upload failed during product creation:', err);
            return img; // fallback to base64
          }
        }
        return img;
      })
    );
  } catch (uploadError) {
    console.warn('Notice: Error uploading product images during creation, falling back to original images:', uploadError);
    imageUrls = product.images;
  }

  // Calculate default display order
  const existingInCol = (memoryProducts || []).filter(p => p.collection === product.collection);
  const maxOrder = existingInCol.reduce((max, p) => p.displayOrder > max ? p.displayOrder : max, 0);
  const displayOrder = maxOrder + 1;

  const createdAt = Date.now();
  const productPayload = {
    ...product,
    images: imageUrls,
    createdAt,
    displayOrder
  };

  if (!supabase) {
    const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const created: Product = {
      id: localId,
      ...productPayload
    };
    if (memoryProducts) {
      memoryProducts.unshift(created);
    } else {
      memoryProducts = [created];
    }
    // Sort memoryProducts again to ensure correct display
    memoryProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return b.createdAt - a.createdAt;
    });
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryProducts));
    return created;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productPayload.name,
        price: productPayload.price,
        description: productPayload.description,
        collection: productPayload.collection,
        images: productPayload.images,
        colors: productPayload.colors,
        sizes: productPayload.sizes,
        inStock: productPayload.inStock,
        createdAt: productPayload.createdAt,
        displayOrder: productPayload.displayOrder
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const created: Product = {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      description: data.description,
      collection: data.collection,
      images: data.images,
      colors: data.colors,
      sizes: data.sizes,
      inStock: data.inStock,
      createdAt: Number(data.createdAt),
      displayOrder: data.displayOrder !== undefined && data.displayOrder !== null ? Number(data.displayOrder) : displayOrder
    };

    if (memoryProducts) {
      memoryProducts.unshift(created);
    } else {
      memoryProducts = [created];
    }
    // Sort memoryProducts again
    memoryProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return b.createdAt - a.createdAt;
    });
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryProducts));

    return created;
  } catch (supabaseError) {
    console.error('Failed to create product in Supabase:', supabaseError);
    throw new Error('Failed to save product permanently to Supabase.');
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, product: Partial<Product>): Promise<void> {
  let imageUrls: string[] | undefined = undefined;
  if (product.images) {
    try {
      imageUrls = await Promise.all(
        product.images.map(async (img) => {
          if (img.startsWith('data:image/')) {
            try {
              return await uploadImageToStorage(img, 'products');
            } catch (err) {
              console.warn('Notice: Individual image upload failed during product update:', err);
              return img;
            }
          }
          return img;
        })
      );
    } catch (uploadError) {
      console.warn('Notice: Error uploading product images during update, falling back to original images:', uploadError);
      imageUrls = product.images;
    }
  }

  const updatePayload = {
    ...product,
    ...(imageUrls ? { images: imageUrls } : {})
  };

  // Update caches
  if (memoryProducts) {
    const index = memoryProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      memoryProducts[index] = { ...memoryProducts[index], ...updatePayload } as Product;
    }
  } else {
    try {
      const cached = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (cached) {
        memoryProducts = JSON.parse(cached);
        const index = memoryProducts!.findIndex(p => p.id === id);
        if (index !== -1) {
          memoryProducts![index] = { ...memoryProducts![index], ...updatePayload } as Product;
        }
      }
    } catch (e) {}
  }

  // Sort memoryProducts again
  if (memoryProducts) {
    memoryProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return b.createdAt - a.createdAt;
    });
  }

  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryProducts || []));

  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from('products')
      .update({
        ...(updatePayload.name !== undefined ? { name: updatePayload.name } : {}),
        ...(updatePayload.price !== undefined ? { price: updatePayload.price } : {}),
        ...(updatePayload.description !== undefined ? { description: updatePayload.description } : {}),
        ...(updatePayload.collection !== undefined ? { collection: updatePayload.collection } : {}),
        ...(updatePayload.images !== undefined ? { images: updatePayload.images } : {}),
        ...(updatePayload.colors !== undefined ? { colors: updatePayload.colors } : {}),
        ...(updatePayload.sizes !== undefined ? { sizes: updatePayload.sizes } : {}),
        ...(updatePayload.inStock !== undefined ? { inStock: updatePayload.inStock } : {}),
        ...(updatePayload.createdAt !== undefined ? { createdAt: updatePayload.createdAt } : {}),
        ...(updatePayload.displayOrder !== undefined ? { displayOrder: updatePayload.displayOrder } : {})
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (supabaseError) {
    console.error('Failed to update product in Supabase:', supabaseError);
    throw new Error('Failed to save product updates permanently to Supabase.');
  }
}

/**
 * Update display orders for a list of products
 */
export async function updateProductOrders(orderedProducts: Product[]): Promise<void> {
  // Update local cache & memory
  const productsMap = new Map(orderedProducts.map((p, idx) => [p.id, idx + 1]));
  
  if (memoryProducts) {
    memoryProducts = memoryProducts.map(p => {
      if (productsMap.has(p.id)) {
        return { ...p, displayOrder: productsMap.get(p.id)! };
      }
      return p;
    });
    // Sort memoryProducts again
    memoryProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return b.createdAt - a.createdAt;
    });
  }
  
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryProducts || []));

  if (!supabase) {
    return;
  }

  try {
    // Perform individual updates to guarantee compliance and simplicity
    const updatePromises = orderedProducts.map((p, idx) => {
      return supabase
        .from('products')
        .update({ displayOrder: idx + 1 })
        .eq('id', p.id);
    });
    
    const results = await Promise.all(updatePromises);
    const firstError = results.find(r => r.error);
    if (firstError) {
      throw firstError.error;
    }
  } catch (error) {
    console.error('Failed to update product display orders in Supabase:', error);
    throw new Error('Failed to save product arrangement permanently to Supabase.');
  }
}

/**
 * Publish / Sync local-only products to Supabase
 */
export async function publishProductsToDatabase(): Promise<{ successCount: number; failedCount: number }> {
  if (!supabase) {
    throw new Error('Database is not configured. Please set your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
  }

  // Get the latest products list
  const currentProducts = await getProducts();
  let successCount = 0;
  let failedCount = 0;

  // Filter out products that are already in Supabase (id does not start with 'local-' or 'fallback-')
  const localOnlyProducts = currentProducts.filter(
    p => p.id.startsWith('local-') || p.id.startsWith('fallback-')
  );

  if (localOnlyProducts.length === 0) {
    return { successCount: 0, failedCount: 0 };
  }

  const updatedProducts = [...currentProducts];

  for (const prod of localOnlyProducts) {
    try {
      // 1. Upload base64 images if any
      let imageUrls: string[] = [];
      try {
        imageUrls = await Promise.all(
          (prod.images || []).map(img => uploadImageToStorage(img, 'products'))
        );
      } catch (e) {
        console.warn(`Failed to upload images for product ${prod.name}:`, e);
        imageUrls = prod.images;
      }

      // 2. Insert into Supabase
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: prod.name,
          price: prod.price,
          description: prod.description,
          collection: prod.collection,
          images: imageUrls,
          colors: prod.colors,
          sizes: prod.sizes,
          inStock: prod.inStock,
          createdAt: prod.createdAt,
          displayOrder: prod.displayOrder || 1
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Update the product in our local list with the database ID and permanent image URLs
        const idx = updatedProducts.findIndex(p => p.id === prod.id);
        if (idx !== -1) {
          updatedProducts[idx] = {
            id: data.id,
            name: data.name,
            price: Number(data.price),
            description: data.description,
            collection: data.collection,
            images: data.images,
            colors: data.colors,
            sizes: data.sizes,
            inStock: data.inStock,
            createdAt: Number(data.createdAt),
            displayOrder: data.displayOrder !== undefined && data.displayOrder !== null ? Number(data.displayOrder) : prod.displayOrder
          };
        }
        successCount++;
      } else {
        failedCount++;
      }
    } catch (err) {
      console.error(`Failed to publish product ${prod.name} to database:`, err);
      failedCount++;
    }
  }

  // Save the updated list with the new UUIDs to localStorage & memory
  memoryProducts = updatedProducts;
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updatedProducts));

  return { successCount, failedCount };
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  // Update caches
  if (memoryProducts) {
    memoryProducts = memoryProducts.filter(p => p.id !== id);
  } else {
    try {
      const cached = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (cached) {
        memoryProducts = JSON.parse(cached);
        memoryProducts = memoryProducts!.filter(p => p.id !== id);
      }
    } catch (e) {}
  }

  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(memoryProducts || []));

  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (supabaseError) {
    console.error('Failed to delete product from Supabase:', supabaseError);
    throw new Error('Failed to delete product permanently from Supabase.');
  }
}

const LOCAL_ORDERS_KEY = 'my_on_local_orders';
let memoryOrders: Order[] | null = null;

/**
 * Fetch all orders, sorted by createdAt descending
 */
export async function getOrders(forceRefresh = false): Promise<Order[]> {
  if (memoryOrders && !forceRefresh) {
    return memoryOrders;
  }

  if (!supabase) {
    const cached = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (cached) {
      try {
        memoryOrders = JSON.parse(cached);
        return memoryOrders || [];
      } catch (e) {
        console.error('Failed to parse cached orders:', e);
      }
    }
    memoryOrders = [];
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.warn('Notice: Error fetching orders from Supabase. The "orders" table might not be created yet. Falling back to local state.', error);
      throw error;
    }

    if (data) {
      const mapped: Order[] = data.map((item: any) => {
        let itemsObj = [];
        try {
          itemsObj = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []);
        } catch (e) {
          itemsObj = item.items || [];
        }

        let shippingDetailsObj = {} as any;
        try {
          shippingDetailsObj = typeof item.shippingDetails === 'string' ? JSON.parse(item.shippingDetails) : (item.shippingDetails || {});
        } catch (e) {
          shippingDetailsObj = item.shippingDetails || {};
        }

        return {
          id: item.id,
          items: itemsObj,
          totalAmount: Number(item.totalAmount),
          shippingCountry: item.shippingCountry,
          shippingDetails: shippingDetailsObj,
          screenshotUrl: item.screenshotUrl,
          status: item.status || 'Pending',
          createdAt: Number(item.createdAt)
        };
      });
      memoryOrders = mapped;
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(mapped));
      return mapped;
    }
  } catch (error) {
    console.warn('Error fetching orders from Supabase, falling back to cache:', error);
    const cached = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (cached) {
      try {
        memoryOrders = JSON.parse(cached);
        return memoryOrders || [];
      } catch (e) {}
    }
  }

  memoryOrders = [];
  return [];
}

/**
 * Create a new order with screenshot upload support
 */
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
  let screenshotUrl = orderData.screenshotUrl || '';
  if (screenshotUrl && screenshotUrl.startsWith('data:image/')) {
    try {
      screenshotUrl = await uploadImageToStorage(screenshotUrl, 'orders');
    } catch (err) {
      console.warn('Notice: Failed to upload order screenshot to Storage, using base64 fallback:', err);
    }
  }

  const id = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const createdAt = Date.now();
  const status: OrderStatus = 'Pending';

  const newOrder: Order = {
    id,
    items: orderData.items,
    totalAmount: orderData.totalAmount,
    shippingCountry: orderData.shippingCountry,
    shippingDetails: orderData.shippingDetails,
    screenshotUrl,
    status,
    createdAt
  };

  // 1. Update memory & LocalStorage
  const currentOrders = await getOrders();
  const updatedOrders = [newOrder, ...currentOrders];
  memoryOrders = updatedOrders;
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updatedOrders));

  // 2. Try Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          id,
          items: newOrder.items,
          totalAmount: newOrder.totalAmount,
          shippingCountry: newOrder.shippingCountry,
          shippingDetails: newOrder.shippingDetails,
          screenshotUrl: newOrder.screenshotUrl,
          status: newOrder.status,
          createdAt: newOrder.createdAt
        });

      if (error) {
        console.warn('Notice: Failed inserting order with object fields, retrying with stringified JSON fields:', error.message);
        const { error: retryError } = await supabase
          .from('orders')
          .insert({
            id,
            items: JSON.stringify(newOrder.items),
            totalAmount: newOrder.totalAmount,
            shippingCountry: newOrder.shippingCountry,
            shippingDetails: JSON.stringify(newOrder.shippingDetails),
            screenshotUrl: newOrder.screenshotUrl,
            status: newOrder.status,
            createdAt: newOrder.createdAt
          });

        if (retryError) {
          throw retryError;
        }
      }
    } catch (supabaseError) {
      console.warn('Notice: Failed to create order in Supabase. Falling back to local storage.', supabaseError);
    }
  }

  return newOrder;
}

/**
 * Update the status of an order
 */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const currentOrders = await getOrders();
  const index = currentOrders.findIndex(o => o.id === id);
  if (index !== -1) {
    currentOrders[index].status = status;
    memoryOrders = currentOrders;
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(currentOrders));
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (supabaseError) {
      console.warn('Notice: Failed to update order status in Supabase. Updated locally.', supabaseError);
    }
  }
}
