import type { Paise } from "./money";

export type Role = "customer" | "seller" | "admin";
export type SellerStatus = "pending" | "active" | "suspended";
export type ProductStatus = "live" | "draft" | "flagged" | "rejected" | "archived";
export type OrderStatus =
  | "pending_payment"
  | "placed"
  | "accepted"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type GroupStatus = "pending_payment" | "paid" | "failed" | "expired";

export interface Seller {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  city: string;
  emoji: string;
  hue: number;
  status: SellerStatus;
  commissionBps: number;
  bankLast4?: string;
  gstin?: string;
  rating: number;
  joinedAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  category: string;
  tags: string[];
  attributes: Record<string, string>;
  price: Paise;
  mrp: Paise;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  flagReason?: string;
  moderationNote?: string;
  hue: number;
  emoji: string;
  image?: string; // optional uploaded data URL
  rating: number;
  /** How many ratings `rating` averages (seed data has more ratings than written reviews). */
  ratingCount?: number;
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
  aiGenerated?: boolean;
}

/** Customer review. Text and author are untrusted input: rendered as text only, never fed to AI as instructions. */
export interface Review {
  id?: string;
  author: string;
  text: string;
  stars: number;
  at?: string;
  verified?: boolean;
  customerId?: string;
  /** Held for admin moderation (e.g. prompt-injection pattern); not shown publicly or counted in the rating. */
  held?: boolean;
  heldReason?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  qty: number;
  unitPrice: Paise;
  lineTotal: Paise;
  commissionBps: number; // snapshotted at purchase
  commission: Paise;
}

export interface TrackEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  groupId: string;
  sellerId: string;
  status: OrderStatus;
  items: OrderItem[];
  gross: Paise;
  commission: Paise;
  payout: Paise;
  refunded: Paise;
  refundedCommission: Paise;
  settled?: boolean;
  tracking: TrackEvent[];
  createdAt: string;
}

export interface OrderGroup {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  total: Paise;
  status: GroupStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  source: "web" | "assistant" | "agent";
  createdAt: string;
  expiresAt: string;
}

export interface LedgerEntry {
  id: string;
  eventId: string;
  eventType: "payment_captured" | "refund" | "payout";
  account: string; // gateway_clearing | platform_commission | seller_payable:<id> | bank_settlement
  debit: Paise;
  credit: Paise;
  orderId?: string;
  sellerId?: string;
  at: string;
  memo: string;
}

export interface Payout {
  id: string;
  sellerId: string;
  amount: Paise;
  status: "paid";
  createdAt: string;
  mode: "simulated_route_transfer";
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export interface AgentCart {
  id: string;
  token: string;
  lines: { productId: string; qty: number }[];
  groupId?: string;
  createdAt: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}
