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
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
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
  status: 'OPEN' | 'CLOSED';
  notes: string | null;
  synced: number;
}

export interface Tax {
  uuid: string;
  name: string;
  rate: number;
  is_default: number;
}

export interface Tariff {
  uuid: string;
  name: string;
  is_tax_included: number;
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
  is_credit_allowed: number;
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
  requires_weight: number;
  is_discountable: number;
  is_refundable: number;
  age_restriction: number;
  image_path: string | null;
  stock_control: number;
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
  doc_type: 'TICKET' | 'INVOICE' | 'REFUND';
  shift_uuid: string | null;
  customer_uuid: string | null;
  user_uuid: string;
  original_sale_uuid: string | null;
  total_net: number;
  total_taxes: number;
  total_amount: number;
  status: 'PARKED' | 'COMPLETED' | 'VOIDED' | 'REFUNDED';
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
  method: 'CASH' | 'CARD' | 'SPLIT';
  amount: number;
  created_at: string;
}