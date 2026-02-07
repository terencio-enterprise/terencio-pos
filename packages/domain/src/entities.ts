export type ISODateString = string; // Format: YYYY-MM-DD HH:mm:ss
export type JsonString = string;    // JSON stringified object
export type BooleanInt = 0 | 1;     // SQLite uses 0/1 for booleans

// ==================================================================================
// 1. CONFIGURATION & SYSTEM
// ==================================================================================
export interface PosConfig {
  id: number; // Always 1
  pos_uuid: string;         // Hardware ID
  pos_serial_code: string;  // Fiscal ID (e.g. "TPV-01")
  store_id: string;
  license_key: string | null;
  verifactu_enabled: BooleanInt;
  test_mode: BooleanInt;
  updated_at: ISODateString;
}

export interface AppSetting {
  key: string;
  value: string | null;
  description: string | null;
  is_system: BooleanInt;
}

// ==================================================================================
// 2. ACCESS CONTROL & STAFF
// ==================================================================================
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | string;

export interface User {
  id: number;
  uuid: string;
  username: string;
  pin_hash: string;
  full_name: string | null;
  role: UserRole;
  permissions_json: JsonString | null; // e.g., { "can_void": true }
  is_active: BooleanInt;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ==================================================================================
// 3. MASTER DATA (CATALOG & PRICING)
// ==================================================================================
export interface Tax {
  id: number;
  name: string;
  rate: number;
  surcharge: number;
  code_aeat: string | null;
  valid_from: ISODateString | null;
  valid_until: ISODateString | null;
  active: BooleanInt;
}

export interface Product {
  id: number;
  uuid: string;
  
  // Display
  name: string;
  short_name: string | null; // Max 20 chars for ticket
  description: string | null;
  
  // Categorization
  category_id: number | null;
  family_code: string | null;
  
  // Fiscal
  tax_id: number;
  
  // Logic Flags
  is_weighted: BooleanInt;       // PLU logic
  is_service: BooleanInt;        // No stock tracking
  is_age_restricted: BooleanInt;
  requires_manager: BooleanInt;
  
  // Inventory
  stock_tracking: BooleanInt;
  stock_current: number;
  min_stock_alert: number;
  
  // Meta
  image_url: string | null;
  active: BooleanInt;
  updated_at: ISODateString;
}

// New: Multi-barcode support
export type BarcodeType = 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'PLU_PREFIX';

export interface ProductBarcode {
  barcode: string; // PK
  product_id: number;
  type: BarcodeType;
  is_primary: BooleanInt;
  quantity_factor: number; // For multipacks (e.g., 6 for a 6-pack)
  created_at: ISODateString;
}

export interface Tariff {
  id: number;
  name: string;
  priority: number;
  active: BooleanInt;
}

export interface ProductPrice {
  product_id: number;
  tariff_id: number;
  price: number;
  created_at: ISODateString;
}

export type PromotionType = 'DISC_PERCENT' | '3X2' | 'MIX_MATCH';

export interface Promotion {
  id: number;
  name: string;
  type: PromotionType;
  start_date: ISODateString;
  end_date: ISODateString;
  priority: number;
  rules_json: JsonString; // Complex rules engine
  active: BooleanInt;
}

// ==================================================================================
// 4. CUSTOMERS (CRM)
// ==================================================================================
export interface Customer {
  id: number;
  uuid: string;
  tax_id: string | null; // NIF/CIF
  legal_name: string | null;
  commercial_name: string | null;
  address: string | null;
  zip_code: string | null;
  email: string | null;
  phone: string | null;
  
  tariff_id: number | null;
  allow_credit: BooleanInt;
  credit_limit: number;
  
  verifactu_ref: string | null;
  active: BooleanInt;
  updated_at: ISODateString;
}

// ==================================================================================
// 5. OPERATIONS: SHIFTS & CASH
// ==================================================================================
export type ShiftStatus = 'OPEN' | 'CLOSED' | 'Z_REPORT_PRINTED';

export interface Shift {
  id: number;
  uuid: string;
  user_id: number;
  pos_id: string; // Hardware identifier
  
  opened_at: ISODateString;
  closed_at: ISODateString | null;
  
  amount_initial: number; // Fondo de caja
  amount_system: number;  // Calculated
  amount_counted: number; // User input
  amount_diff: number;    // Discrepancy
  
  status: ShiftStatus;
  z_report_number: number | null;
}

export type CashMovementType = 'IN' | 'OUT';

export interface CashMovement {
  id: number;
  shift_uuid: string;
  user_id: number;
  type: CashMovementType;
  amount: number;
  reason: string | null;
  created_at: ISODateString;
}

// ==================================================================================
// 6. SALES & TRANSACTIONS
// ==================================================================================
export interface DocSequence {
  series: string;
  year: number;
  current_value: number;
}

export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'VOIDED' | 'REFUNDED';

export interface Sale {
  id: number;
  uuid: string;
  
  // Document ID
  series: string;
  number: number;
  full_reference: string; // e.g., "F24-0001"
  
  // Timing
  created_at: ISODateString; // Basket start
  issued_at: ISODateString | null; // Fiscal issuance
  
  // Context
  shift_uuid: string;
  user_id: number;
  customer_id: number | null;
  
  // Status
  status: SaleStatus;
  is_fiscal_issued: BooleanInt;
  
  // Rectification
  rectifies_uuid: string | null;
  rectification_reason: string | null;
  
  // Financials
  total_net: number;
  total_tax: number;
  total_amount: number;
  
  // Verification
  qr_data: string | null; // VeriFactu QR Content
}

export interface SaleLine {
  id: number;
  sale_uuid: string;
  
  product_id: number | null;
  barcode_used: string | null;
  description_snapshot: string;
  
  quantity: number;
  unit_price: number;
  
  // Discounts
  discount_percent: number;
  discount_amount: number;
  promotion_applied_id: number | null;
  
  // Taxes
  tax_id: number;
  tax_rate_snapshot: number;
  
  total_line: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'VOUCHER' | 'CREDIT';

export interface Payment {
  id: number;
  sale_uuid: string;
  method: PaymentMethod;
  amount: number;
  details_json: JsonString | null;
  created_at: ISODateString;
}

// ==================================================================================
// 7. VERIFACTU CORE (FISCAL LEDGER)
// ==================================================================================
export type FiscalEventType = 'ALTA' | 'ANULACION';

export interface FiscalChainRecord {
  id: number;
  uuid: string;
  
  sale_uuid: string;
  event_type: FiscalEventType;
  
  // Chain Security
  previous_record_hash: string;
  chain_sequence_id: number;
  
  // Data Snapshot
  issuer_nif: string;
  invoice_series: string;
  invoice_number: string;
  invoice_date: string;
  invoice_amount: number;
  
  // Cryptography
  record_hash: string;
  signature: string | null;
  system_fingerprint: string;
  
  // AEAT Sync
  sent_to_aeat: BooleanInt;
  aeat_csv: string | null;
  aeat_response_json: JsonString | null;
  
  created_at: ISODateString;
}