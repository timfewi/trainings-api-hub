// shared/types/ecommerce.ts

/**
 * Product category interface for dummy API
 */
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

/**
 * Product interface for dummy API
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category?: ProductCategory;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity: number;
  sku: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shopping cart item interface
 */
export interface CartItem {
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Shopping cart interface
 */
export interface ShoppingCart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order status enumeration
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address interface
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Dummy user interface for API instances
 */
export interface DummyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  address: Address;
  phone: string;
  createdAt: Date;
}
