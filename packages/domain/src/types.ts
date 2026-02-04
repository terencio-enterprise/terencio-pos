// ==========================================
// Enums & Constants
// ==========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum SaleDocType {
  TICKET = 'TICKET',
  INVOICE = 'INVOICE',
  REFUND = 'REFUND'
}

export enum SaleStatus {
  PARKED = 'PARKED',
  COMPLETED = 'COMPLETED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  SPLIT = 'SPLIT'
}

// ==========================================
// Database Entities (Row Mappings)
// ==========================================

export interface AppSetting {
  key: string;
  value: string;
  description: string | null;
}

export interface User {
  uuid: string;
  username: string;
  pin_hash: string | null;
  full_name: string | null;
  role: UserRole;
  is_active: number; // 0 or 1
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Shift {
  uuid: string;
  user_uuid: string;
  device_id: string | null;
  start_time: string;
  end_time: string | null;
  starting_cash: number;
  expected_cash: number;
  counted_cash: number;
  discrepancy: number;
  status: ShiftStatus;
  notes: string | null;
  synced: number; // 0 or 1
}

export interface Tax {
  uuid: string;
  name: string;
  rate: number;
  is_default: number; // 0 or 1
}

export interface Tariff {
  uuid: string;
  name: string;
  is_tax_included: number; // 0 or 1
  priority: number;
}

export interface Customer {
  uuid: string;
  code: string | null;
  tax_id: string | null;
  business_name: string | null;
  trade_name: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  email: string | null;
  phone: string | null;
  tariff_uuid: string | null;
  is_credit_allowed: number; // 0 or 1
  tier_level: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  uuid: string;
  reference: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  category: string | null;
  tax_uuid: string;
  requires_weight: number; // 0 or 1
  is_discountable: number; // 0 or 1
  is_refundable: number; // 0 or 1
  age_restriction: number;
  image_path: string | null;
  stock_control: number; // 0 or 1
  stock_current: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductPrice {
  product_uuid: string;
  tariff_uuid: string;
  price: number;
  updated_at: string;
}

export interface Sale {
  uuid: string;
  doc_number: string;
  doc_type: SaleDocType;
  shift_uuid: string | null;
  customer_uuid: string | null;
  user_uuid: string;
  original_sale_uuid: string | null;
  total_net: number;
  total_taxes: number;
  total_amount: number;
  status: SaleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleLine {
  uuid: string;
  sale_uuid: string;
  product_uuid: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  discount_amount: number;
  promotion_uuid: string | null;
  total_line: number;
  created_at: string;
}

export interface Payment {
  uuid: string;
  sale_uuid: string;
  method: PaymentMethod;
  amount: number;
  created_at: string;
}
