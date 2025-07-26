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
} from '@trainings-api-hub/shared';

/**
 * In-memory data service for generating and managing fake e-commerce data
 */
export class DataService {
  private categories: ProductCategory[] = [];
  private products: Product[] = [];
  private cart: ShoppingCart | null = null;
  private orders: Order[] = [];
  private users: DummyUser[] = [];

  /**
   * Initialize the data service with fake data
   */
  async initialize(): Promise<void> {
    this.generateCategories();
    this.generateProducts();
    this.generateUsers();
    this.initializeCart();
    this.generateOrders();
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
   * Generate fake product categories
   */
  private generateCategories(): void {
    const categoryNames = [
      'Electronics',
      'Clothing',
      'Books',
      'Home & Garden',
      'Sports & Outdoors',
      'Health & Beauty',
      'Toys & Games',
      'Automotive',
    ];

    this.categories = categoryNames.map(name => ({
      id: uuidv4(),
      name,
      description: faker.commerce.productDescription(),
      imageUrl: faker.image.url(),
    }));
  }

  /**
   * Generate fake products
   */
  private generateProducts(): void {
    this.products = [];

    this.categories.forEach(category => {
      const productCount = faker.number.int({ min: 5, max: 15 });

      for (let i = 0; i < productCount; i++) {
        const product: Product = {
          id: uuidv4(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: Number(faker.commerce.price({ min: 10, max: 1000 })),
          categoryId: category.id,
          category,
          imageUrl: faker.image.url(),
          inStock: faker.datatype.boolean(0.8), // 80% chance in stock
          stockQuantity: faker.number.int({ min: 0, max: 100 }),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          tags: faker.helpers.arrayElements(['new', 'sale', 'popular', 'featured', 'limited']),
          createdAt: faker.date.past(),
          updatedAt: new Date(),
        };

        this.products.push(product);
      }
    });
  }

  /**
   * Generate fake users
   */
  private generateUsers(): void {
    for (let i = 0; i < 10; i++) {
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
   * Generate some sample orders
   */
  private generateOrders(): void {
    for (let i = 0; i < 5; i++) {
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
}
