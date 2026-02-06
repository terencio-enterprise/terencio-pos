export type ISODateString = string; // Format: YYYY-MM-DD HH:mm:ss

// ==================================================================================
// 1. APP SETTINGS
// ==================================================================================
export interface AppSettings {
  key: string;
  value: string | null;
  description: string | null;
}

// ==================================================================================
// 2. USERS
// ==================================================================================
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | string;

export interface User {
  uuid: string;
  username: string;
  pin_hash: string | null;
  full_name: string | null;
  role: UserRole;
  is_active: number; // 0 or 1
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 3. SHIFTS
// ==================================================================================
export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface Shift {
  uuid: string;
  user_uuid: string;
  device_id: string | null;
  start_time: ISODateString;
  end_time: ISODateString | null;
  starting_cash: number;
  expected_cash: number;
  counted_cash: number;
  discrepancy: number;
  status: ShiftStatus;
  notes: string | null;
  synced: number; // 0 or 1
}

// ==================================================================================
// 4. TAXES
// ==================================================================================
export interface Tax {
  uuid: string;
  name: string;
  rate: number;
  is_default: number;
  active: number;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 5. TARIFFS
// ==================================================================================
export interface Tariff {
  uuid: string;
  name: string;
  is_tax_included: number;
  priority: number;
  active: number;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 6. CUSTOMERS
// ==================================================================================
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
  active: number;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 7. PRODUCTS
// ==================================================================================
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
  active: number;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 8. PRODUCT PRICES
// ==================================================================================
export interface ProductPrice {
  product_uuid: string;
  tariff_uuid: string;
  price: number;
  updated_at: ISODateString;
}

// ==================================================================================
// 9. PROMOTIONS
// ==================================================================================
export interface Promotion {
  uuid: string;
  name: string;
  type: string;
  start_date: ISODateString | null;
  end_date: ISODateString | null;
  priority: number;
  rules_json: string | null;
  active: number;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 10. SALES
// ==================================================================================
export type SaleStatus = 'COMPLETED' | 'CANCELLED';
export type SaleDocType = 'FV' | 'FR' | string; // Factura Venta, Rectificativa etc.

export interface Sale {
  uuid: string;
  
  // Identificación
  doc_series: string;
  doc_number: number;
  doc_full_id: string;
  
  doc_type: SaleDocType;
  issue_date: ISODateString;
  
  // Estado
  is_issued: number;
  status: SaleStatus;
  
  // Rectificación
  rectification_type: string | null;
  rectified_sale_uuid: string | null;
  
  // Contexto
  shift_uuid: string | null;
  customer_uuid: string | null;
  user_uuid: string;
  
  // Totales
  total_net: number;
  total_taxes: number;
  total_amount: number;
  
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ==================================================================================
// 11. FISCAL RECORDS (VERIFACTU)
// ==================================================================================
export type FiscalRecordType = 'ALTA' | 'ANULACION';

export interface FiscalRecord {
  uuid: string;
  sale_uuid: string;
  
  fiscal_sequence: number;
  record_type: FiscalRecordType;
  
  previous_hash: string | null;
  hash: string;
  fingerprint: string;
  signature: string | null;
  
  created_at: ISODateString;
}

// ==================================================================================
// 12. SALE LINES
// ==================================================================================
export interface SaleLine {
  uuid: string;
  sale_uuid: string;
  product_uuid: string | null;
  product_name: string;
  
  quantity: number;
  unit_price: number;
  
  // Snapshot Fiscal
  tax_uuid: string | null;
  tax_rate: number;
  tax_amount: number;
  
  discount_percent: number;
  discount_amount: number;
  promotion_uuid: string | null;
  
  total_line: number;
  
  created_at: ISODateString;
}

// ==================================================================================
// 13. SALE TAX SUMMARY
// ==================================================================================
export interface SaleTaxSummary {
  sale_uuid: string;
  tax_uuid: string | null;
  tax_name_snapshot: string;
  tax_rate_snapshot: number;
  base_amount: number;
  tax_amount: number;
}

// ==================================================================================
// 14. PAYMENTS
// ==================================================================================
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | string;

export interface Payment {
  uuid: string;
  sale_uuid: string;
  method: PaymentMethod;
  amount: number;
  created_at: ISODateString;
}

// ==================================================================================
// 15. DOCUMENT SEQUENCES
// ==================================================================================
export interface DocumentSequence {
  series: string;
  device_id: string;
  current_value: number;
}
