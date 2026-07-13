/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum OrderStatus {
  RECEIVED = "Received",
  PREPARING = "Preparing",
  READY = "Ready for Pickup",
  OUT_FOR_DELIVERY = "Out for Delivery",
  DELIVERED = "Delivered"
}

export enum DeliveryType {
  PICKUP = "Pickup",
  DELIVERY = "Delivery"
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

export interface NutritionalInfo {
  calories: number;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  inStock: boolean;
  isTodaySpecial?: boolean;
  proteinOptions?: string[]; // E.g., ["Beef", "Goat Meat", "Fish"]
  nutrition?: NutritionalInfo;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtTime: number;
  selectedProtein?: string;
  proteinExtraFee?: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  deliveryType: DeliveryType;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  discountCode?: string;
  total: number;
  pointsRedeemed?: number;
  loyaltyDiscount?: number;
  items: OrderItem[];
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  validUntil: string;
  maxUses: number;
  usesCount: number;
  isActive: boolean;
}

export interface KitchenSettings {
  deliveryFee: number;
  isOpen: boolean;
  openingTime: string; // E.g. "08:00"
  closingTime: string; // E.g. "21:00"
  kitchenPhone: string; // WhatsApp number
  closingDays: string[]; // E.g. ["Sunday"]
}

export interface DashboardStats {
  todayOrdersCount: number;
  todayRevenue: number;
  pendingOrdersCount: number;
  popularItems: { name: string; count: number; revenue: number }[];
  revenueByDay: { date: string; amount: number; orders: number }[];
}

export interface Review {
  id: string;
  customerName: string;
  phone: string;
  menuItemId: string;
  menuItemName: string;
  rating: number;
  comment: string;
  createdAt: string;
  likes: number;
}

export interface AdminNotification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  amount: number;
  orderId: string;
  customerName: string;
  isRead: boolean;
}

