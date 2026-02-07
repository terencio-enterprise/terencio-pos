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
// 2. USERS (Synced from backend)
// ==================================================================================
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | string;

export interface User {
  id: number;
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
// 3. SHIFTS (POS Generated)
// ==================================================================================
export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface Shift {
  uuid: string;
  user_id: number;
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
// 4. TAXES (Synced from backend)
// ==================================================================================
export interface Tax {
  id: number;
  name: string;
  rate: number;
  is_default: number;
  active: number;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 5. TARIFFS (Synced from backend)
// ==================================================================================
export interface Tariff {
  id: number;
  name: string;
  is_tax_included: number;
  priority: number;
  active: number;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 6. CUSTOMERS (Synced from backend)
// ==================================================================================
export interface Customer {
  id: number;
  code: string | null;
  tax_id: string | null;
  business_name: string | null;
  trade_name: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  email: string | null;
  phone: string | null;
  tariff_id: number | null;
  is_credit_allowed: number;
  tier_level: string | null;
  notes: string | null;
  active: number;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

// ==================================================================================
// 7. PRODUCTS (Synced from backend)
// ==================================================================================
export interface Product {
  id: number;
  reference: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  category: string | null;
  tax_id: number;
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
// 8. PRODUCT PRICES (Synced from backend)
// ==================================================================================
export interface ProductPrice {
  product_id: number;
  tariff_id: number;
  price: number;
  updated_at: ISODateString;
}

// ==================================================================================
// 9. PROMOTIONS (Synced from backend)
// ==================================================================================
export interface Promotion {
  id: number;
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
// 10. SALES (POS Generated)
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
  customer_id: number | null;
  user_id: number;
  
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
// 12. SALE LINES (POS Generated)
// ==================================================================================
export interface SaleLine {
  uuid: string;
  sale_uuid: string;
  product_id: number | null;
  product_name: string;
  
  quantity: number;
  unit_price: number;
  
  // Snapshot Fiscal
  tax_id: number | null;
  tax_rate: number;
  tax_amount: number;
  
  discount_percent: number;
  discount_amount: number;
  promotion_id: number | null;
  
  total_line: number;
  
  created_at: ISODateString;
}

// ==================================================================================
// 13. SALE TAX SUMMARY (POS Generated)
// ==================================================================================
export interface SaleTaxSummary {
  sale_uuid: string;
  tax_id: number | null;
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

// ==================================================================================
// 16. POS CONFIGURATION
// ==================================================================================
export interface POSConfiguration {
  id?: number;
  pos_id: string;
  pos_name: string;
  store_id: string;
  store_name: string;
  device_id: string;
  registration_code?: string;
  registered_at: string;
  last_sync_at?: string;
  is_active: number; // 0 or 1
  created_at?: string;
}

export interface POSRegistrationResponse {
  posId: string;
  posName: string;
  storeId: string;
  storeName: string;
  deviceId: string;
  users: User[];
}

