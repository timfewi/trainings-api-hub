// packages/dummy-api/src/services/DataService.ts

import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import {
  Product,
  ProductCategory,
  ShoppingCart,
  CartItem,
  Order,
  OrderStatus,
  DummyUser,
  Address,
} from '../types';
import { ApiConfig, DataTheme } from '../config';

/**
 * In-memory data service for generating and managing fake e-commerce data
 */
export class DataService {
  private categories: ProductCategory[] = [];
  private products: Product[] = [];
  private cart: ShoppingCart | null = null;
  private orders: Order[] = [];
  private users: DummyUser[] = [];
  private initialized = false;
  private readonly config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;

    // Set random seed if provided for reproducible data
    if (config.randomSeed) {
      faker.seed(parseInt(config.randomSeed, 10));
    }
  }

  /**
   * Initialize the data service with fake data
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log(`🔄 Initializing data service with theme: ${this.config.dataTheme}`);

    this.generateCategories();
    this.generateProducts();
    this.generateUsers();
    this.initializeCart();
    this.generateOrders();

    this.initialized = true;
    console.log(
      `✅ Data service initialized with ${this.products.length} products in ${this.categories.length} categories`
    );
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get data generation statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      theme: this.config.dataTheme,
      productCount: this.products.length,
      categoryCount: this.categories.length,
      userCount: this.users.length,
      orderCount: this.orders.length,
    };
  }

  /**
   * Get all product categories
   */
  getCategories(): ProductCategory[] {
    return this.categories;
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): ProductCategory | undefined {
    return this.categories.find(category => category.id === id);
  }

  /**
   * Get all products with optional category filter
   */
  getProducts(categoryId?: string): Product[] {
    if (categoryId) {
      return this.products.filter(product => product.categoryId === categoryId);
    }
    return this.products;
  }

  /**
   * Get product by ID
   */
  getProductById(id: string): Product | undefined {
    return this.products.find(product => product.id === id);
  }

  /**
   * Get current shopping cart
   */
  getCart(): ShoppingCart {
    if (!this.cart) {
      this.initializeCart();
    }
    return this.cart!;
  }

  /**
   * Add item to cart
   */
  addToCart(productId: string, quantity: number): CartItem | null {
    const product = this.getProductById(productId);
    if (!product) {
      return null;
    }

    const cart = this.getCart();
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      const newItem: CartItem = {
        productId,
        product,
        quantity,
        unitPrice: product.price,
        totalPrice: quantity * product.price,
      };
      cart.items.push(newItem);
    }

    this.updateCartTotal();
    return cart.items.find(item => item.productId === productId)!;
  }

  /**
   * Update cart item quantity
   */
  updateCartItem(productId: string, quantity: number): CartItem | null {
    const cart = this.getCart();
    const item = cart.items.find(cartItem => cartItem.productId === productId);

    if (!item) {
      return null;
    }

    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    item.quantity = quantity;
    item.totalPrice = item.quantity * item.unitPrice;
    this.updateCartTotal();
    return item;
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: string): CartItem | null {
    const cart = this.getCart();
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return null;
    }

    const removedItem = cart.items.splice(itemIndex, 1)[0];
    if (!removedItem || removedItem.quantity <= 0) {
      return null;
    }

    this.updateCartTotal();
    return removedItem;
  }

  /**
   * Clear all items from cart
   */
  clearCart(): void {
    if (this.cart) {
      this.cart.items = [];
      this.cart.totalAmount = 0;
    }
  }

  /**
   * Create a new order from current cart
   */
  createOrder(shippingAddress: Address, billingAddress: Address): Order {
    const cart = this.getCart();
    const order: Order = {
      id: uuidv4(),
      userId: 'dummy-user',
      items: [...cart.items],
      status: OrderStatus.PENDING,
      totalAmount: cart.totalAmount,
      shippingAddress,
      billingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.push(order);
    this.clearCart();
    return order;
  }

  /**
   * Get all orders
   */
  getOrders(): Order[] {
    return this.orders;
  }

  /**
   * Get order by ID
   */
  getOrderById(id: string): Order | undefined {
    return this.orders.find(order => order.id === id);
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): DummyUser | undefined {
    return this.users.find(user => user.id === id);
  }

  /**
   * Generate fake product categories based on theme
   */
  private generateCategories(): void {
    const categoryData = this.getCategoryDataByTheme(this.config.dataTheme);
    const targetCount = Math.min(this.config.categoryCount, categoryData.length);

    const selectedCategories = faker.helpers.arrayElements(categoryData, {
      min: targetCount,
      max: targetCount,
    });

    this.categories = selectedCategories.map(name => ({
      id: uuidv4(),
      name,
      description: this.generateCategoryDescription(name, this.config.dataTheme),
      imageUrl: faker.image.url(),
    }));
  }

  /**
   * Generate fake products based on configuration
   */
  private generateProducts(): void {
    this.products = [];

    this.categories.forEach(category => {
      const productCount = this.config.productCount;

      for (let i = 0; i < productCount; i++) {
        const product: Product = {
          id: uuidv4(),
          name: this.generateProductName(category.name, this.config.dataTheme),
          description: this.generateProductDescription(category.name, this.config.dataTheme),
          price: this.generateProductPrice(category.name, this.config.dataTheme),
          categoryId: category.id,
          category,
          imageUrl: faker.image.url(),
          inStock: faker.datatype.boolean(0.8), // 80% chance in stock
          stockQuantity: faker.number.int({ min: 0, max: 100 }),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          tags: this.generateProductTags(category.name, this.config.dataTheme),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        };

        this.products.push(product);
      }
    });
  }

  /**
   * Generate fake users based on configuration
   */
  private generateUsers(): void {
    for (let i = 0; i < this.config.userCount; i++) {
      const user: DummyUser = {
        id: uuidv4(),
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
        },
        phone: faker.phone.number(),
        createdAt: faker.date.past(),
      };

      this.users.push(user);
    }
  }

  /**
   * Initialize empty shopping cart
   */
  private initializeCart(): void {
    this.cart = {
      id: uuidv4(),
      userId: 'dummy-user',
      items: [],
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Update cart total amount
   */
  private updateCartTotal(): void {
    if (this.cart) {
      this.cart.totalAmount = this.cart.items.reduce((total, item) => total + item.totalPrice, 0);
      this.cart.updatedAt = new Date();
    }
  }

  /**
   * Generate some sample orders based on configuration
   */
  private generateOrders(): void {
    for (let i = 0; i < this.config.orderCount; i++) {
      const randomProducts = faker.helpers.arrayElements(this.products, { min: 1, max: 4 });
      const items: CartItem[] = randomProducts.map(product => ({
        productId: product.id,
        product,
        quantity: faker.number.int({ min: 1, max: 3 }),
        unitPrice: product.price,
        totalPrice: 0, // Will be calculated
      }));

      // Calculate total price for each item
      items.forEach(item => {
        item.totalPrice = item.quantity * item.unitPrice;
      });

      const order: Order = {
        id: uuidv4(),
        userId: faker.helpers.arrayElement(this.users).id,
        items,
        status: faker.helpers.enumValue(OrderStatus),
        totalAmount: items.reduce((total, item) => total + item.totalPrice, 0),
        shippingAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
        },
        billingAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
        },
        createdAt: faker.date.past(),
        updatedAt: new Date(),
      };

      this.orders.push(order);
    }
  }

  /**
   * Get category names based on data theme
   */
  private getCategoryDataByTheme(theme: DataTheme): string[] {
    const categoryMap: Record<DataTheme, string[]> = {
      electronics: [
        'Smartphones & Tablets',
        'Laptops & Computers',
        'Audio & Headphones',
        'Smart Home',
        'Gaming',
        'Cameras & Photography',
        'Wearables',
        'Accessories',
      ],
      fashion: [
        "Men's Clothing",
        "Women's Clothing",
        'Shoes & Footwear',
        'Accessories',
        'Bags & Luggage',
        'Jewelry & Watches',
        'Activewear',
        'Formal Wear',
      ],
      books: [
        'Fiction',
        'Non-Fiction',
        'Science & Technology',
        'Business & Economics',
        'Health & Fitness',
        'Arts & Entertainment',
        "Children's Books",
        'Educational',
      ],
      automotive: [
        'Car Parts',
        'Motorcycle Parts',
        'Tools & Equipment',
        'Car Care',
        'Interior Accessories',
        'Exterior Accessories',
        'Performance Parts',
        'Safety & Security',
      ],
      home: [
        'Furniture',
        'Kitchen & Dining',
        'Bedding & Bath',
        'Home Decor',
        'Garden & Outdoor',
        'Appliances',
        'Storage & Organization',
        'Lighting',
      ],
      beauty: [
        'Skincare',
        'Makeup',
        'Hair Care',
        'Fragrances',
        'Personal Care',
        'Tools & Accessories',
        "Men's Grooming",
        'Natural & Organic',
      ],
      sports: [
        'Fitness Equipment',
        'Outdoor Sports',
        'Team Sports',
        'Water Sports',
        'Winter Sports',
        'Athletic Wear',
        'Sports Nutrition',
        'Recovery & Wellness',
      ],
      general: [
        'Electronics',
        'Clothing',
        'Books',
        'Home & Garden',
        'Sports & Outdoors',
        'Health & Beauty',
        'Toys & Games',
        'Automotive',
      ],
    };

    return categoryMap[theme] || categoryMap.general;
  }

  /**
   * Generate category description based on theme
   */
  private generateCategoryDescription(categoryName: string, theme: DataTheme): string {
    const themeDescriptions: Record<DataTheme, (name: string) => string> = {
      electronics: name =>
        `Discover the latest ${name.toLowerCase()} with cutting-edge technology and innovative features.`,
      fashion: name =>
        `Explore our stylish collection of ${name.toLowerCase()} featuring the latest trends and timeless classics.`,
      books: name =>
        `Immerse yourself in our extensive ${name.toLowerCase()} collection, carefully curated for every reader.`,
      automotive: name =>
        `Premium ${name.toLowerCase()} designed for performance, reliability, and safety on the road.`,
      home: name =>
        `Transform your living space with our beautiful ${name.toLowerCase()} collection.`,
      beauty: name =>
        `Enhance your natural beauty with our premium ${name.toLowerCase()} products.`,
      sports: name =>
        `Elevate your athletic performance with professional-grade ${name.toLowerCase()}.`,
      general: name => `High-quality ${name.toLowerCase()} for all your needs.`,
    };

    return themeDescriptions[theme]?.(categoryName) || themeDescriptions.general(categoryName);
  }

  /**
   * Generate product name based on category and theme
   */
  private generateProductName(categoryName: string, theme: DataTheme): string {
    const productNameGenerators: Record<DataTheme, (category: string) => string> = {
      electronics: category => {
        const prefixes = ['Pro', 'Ultra', 'Smart', 'Elite', 'Premium'];
        const suffixes = ['X', 'Plus', 'Max', 'Pro', 'Elite'];
        return `${faker.helpers.arrayElement(prefixes)} ${faker.commerce.productName()} ${faker.helpers.arrayElement(suffixes)}`;
      },
      fashion: category => {
        const brands = ['Style', 'Elegant', 'Classic', 'Modern', 'Trendy'];
        return `${faker.helpers.arrayElement(brands)} ${faker.commerce.productName()}`;
      },
      books: category => {
        return `${faker.lorem.words(3)} ${faker.helpers.arrayElement(['Guide', 'Handbook', 'Manual', 'Reference', 'Complete Works'])}`;
      },
      automotive: category => {
        const types = ['Performance', 'Premium', 'Heavy-Duty', 'Professional', 'OEM'];
        return `${faker.helpers.arrayElement(types)} ${faker.commerce.productName()}`;
      },
      home: category => {
        const styles = ['Modern', 'Classic', 'Rustic', 'Contemporary', 'Vintage'];
        return `${faker.helpers.arrayElement(styles)} ${faker.commerce.productName()}`;
      },
      beauty: category => {
        const qualities = ['Luxurious', 'Natural', 'Hydrating', 'Anti-Aging', 'Organic'];
        return `${faker.helpers.arrayElement(qualities)} ${faker.commerce.productName()}`;
      },
      sports: category => {
        const levels = ['Professional', 'Elite', 'Training', 'Competition', 'Premium'];
        return `${faker.helpers.arrayElement(levels)} ${faker.commerce.productName()}`;
      },
      general: () => faker.commerce.productName(),
    };

    return (
      productNameGenerators[theme]?.(categoryName) || productNameGenerators.general(categoryName)
    );
  }

  /**
   * Generate product description based on category and theme
   */
  private generateProductDescription(categoryName: string, theme: DataTheme): string {
    const baseDescription = faker.commerce.productDescription();

    const themeDescriptions: Record<DataTheme, string[]> = {
      electronics: [
        'Advanced technology',
        'Latest innovation',
        'Cutting-edge design',
        'High performance',
      ],
      fashion: ['Stylish design', 'Premium materials', 'Comfortable fit', 'Latest fashion trends'],
      books: ['Comprehensive content', 'Expert insights', 'Detailed analysis', 'Essential reading'],
      automotive: [
        'Durable construction',
        'Precision engineering',
        'Reliable performance',
        'Safety certified',
      ],
      home: ['Beautiful design', 'Quality craftsmanship', 'Functional style', 'Perfect fit'],
      beauty: ['Gentle formula', 'Natural ingredients', 'Proven results', 'Dermatologist tested'],
      sports: [
        'Professional grade',
        'Enhanced performance',
        'Durable materials',
        'Competition ready',
      ],
      general: ['High quality', 'Great value', 'Reliable performance', 'Customer favorite'],
    };

    const additionalFeatures = themeDescriptions[theme] || themeDescriptions.general;
    const features = faker.helpers.arrayElements(additionalFeatures, { min: 2, max: 3 });

    return `${baseDescription} Features: ${features.join(', ')}.`;
  }

  /**
   * Generate product price based on category and theme
   */
  private generateProductPrice(categoryName: string, theme: DataTheme): number {
    const priceRanges: Record<DataTheme, { min: number; max: number }> = {
      electronics: { min: 50, max: 2000 },
      fashion: { min: 20, max: 500 },
      books: { min: 10, max: 100 },
      automotive: { min: 25, max: 1500 },
      home: { min: 30, max: 800 },
      beauty: { min: 15, max: 200 },
      sports: { min: 25, max: 600 },
      general: { min: 10, max: 1000 },
    };

    const range = priceRanges[theme] || priceRanges.general;
    return Number(faker.commerce.price({ min: range.min, max: range.max }));
  }

  /**
   * Generate product tags based on category and theme
   */
  private generateProductTags(categoryName: string, theme: DataTheme): string[] {
    const commonTags = ['new', 'sale', 'popular', 'featured'];

    const themeTags: Record<DataTheme, string[]> = {
      electronics: ['tech', 'smart', 'wireless', 'premium', 'innovation'],
      fashion: ['style', 'trendy', 'comfortable', 'designer', 'seasonal'],
      books: ['bestseller', 'educational', 'reference', 'classic', 'paperback'],
      automotive: ['performance', 'oem', 'replacement', 'upgrade', 'certified'],
      home: ['decor', 'functional', 'modern', 'space-saving', 'durable'],
      beauty: ['natural', 'organic', 'anti-aging', 'moisturizing', 'cruelty-free'],
      sports: ['professional', 'training', 'outdoor', 'lightweight', 'ergonomic'],
      general: ['quality', 'value', 'reliable', 'essential'],
    };

    const availableTags = [...commonTags, ...(themeTags[theme] || themeTags.general)];
    return faker.helpers.arrayElements(availableTags, { min: 2, max: 4 });
  }
}
