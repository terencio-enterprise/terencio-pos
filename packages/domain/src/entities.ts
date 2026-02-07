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

// Runtime POS configuration (used during registration and runtime)
export interface POSConfiguration {
  pos_id: string;
  pos_name: string;
  store_id: string;
  store_name: string;
  device_id: string;
  registration_code?: string | null;
  registered_at: string;
  is_active: BooleanInt;
}

// ==================================================================================
// REGISTRATION DTOs (matching backend API structure)
// ==================================================================================

/**
 * Request DTO for POS registration preview.
 * Validates registration code and returns store/user context.
 */
export interface PosRegistrationPreviewRequest {
  code: string;
  deviceId: string;
}

/**
 * Response DTO for POS registration preview.
 * Contains store and user information for initial sync.
 */
export interface PosRegistrationPreviewDto {
  posId: string;         // Generated/Pre-assigned logical ID
  posName: string;       // "Caja Principal 01"
  storeId: string;       // UUID
  storeName: string;
  users: UserDto[];      // Initial sync of users
}

/**
 * Request DTO for POS registration confirmation.
 * Creates device and completes registration.
 */
export interface PosRegistrationConfirmRequest {
  code: string;
  hardwareId: string;
}

/**
 * Response DTO for POS registration confirmation.
 * Contains device and license information.
 */
export interface PosRegistrationResultDto {
  storeId: string;
  storeName: string;
  deviceId: string;
  serialCode: string;
  licenseKey: string;
}

/**
 * User DTO for registration responses.
 */
export interface UserDto {
  id: number;
  uuid: string;
  username: string;
  fullName: string | null;
  role: UserRole;
  pinHash: string;
  isActive: BooleanInt;
  createdAt: string;
  updatedAt: string;
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
  reference: string | null;
  
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
  last_stock_sync: ISODateString | null;
  reserved_stock: number;
  
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
  surcharge_apply: BooleanInt;
  
  verifactu_ref: string | null;
  active: BooleanInt;
  
  sync_status: 'PENDING' | 'SYNCED' | 'ERROR';
  last_updated_server: ISODateString | null;
  
  updated_at: ISODateString;
}

// ==================================================================================
// 5. OPERATIONS: SHIFTS & CASH
// ==================================================================================
export type ShiftStatus = 'OPEN' | 'CLOSED';

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
  
  // Enterprise: Z Report
  z_report_number: number | null;
  z_series: string | null;
  z_year: number | null;
  z_report_hash: string | null;
  z_report_signature: string | null;
  
  // Audit
  reopened: BooleanInt;
  reopened_by_user_id: number | null;
  reopened_reason: string | null;
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

export type CashDrawerEventType = 'SALE_OPEN' | 'MANUAL_OPEN' | 'CHANGE';

export interface CashDrawerEvent {
  id: number;
  shift_uuid: string | null;
  user_id: number;
  event_type: CashDrawerEventType;
  timestamp: ISODateString;
}

// ==================================================================================
// 6. SALES & TRANSACTIONS
// ==================================================================================
export interface DocSequence {
  series: string;
  year: number;
  current_value: number;
}

export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'RECTIFIED';
export type SaleType = 'SIMPLIFIED' | 'FULL';

export interface Sale {
  id: number;
  uuid: string;
  global_uuid: string | null;
  
  // Document ID
  series: string;
  number: number;
  full_reference: string; // e.g., "T24-0001"
  
  // Legal Type
  type: SaleType;
  billing_upgraded_from_simplified: BooleanInt;
  
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
  
  // Rectification / Void Logic
  rectifies_uuid: string | null;
  rectification_reason: string | null;
  void_reason_code: string | null;
  void_reason_text: string | null;
  
  // Audit
  print_count: number;
  last_printed_at: ISODateString | null;
  
  // Financials
  total_net: number;
  total_tax: number;
  total_surcharge: number;
  total_amount: number;
  
  // Verification
  qr_data: string | null; // VeriFactu QR Content
  
  // Sync
  sync_status: 'PENDING' | 'SYNCED' | 'ERROR';
  server_id: number | null;
}

export interface SaleBillingInfo {
  sale_uuid: string; // PK/FK
  customer_legal_name: string;
  customer_nif: string;
  customer_address: string | null;
  customer_city: string | null;
  customer_zip: string | null;
  customer_country: string;
}

export type SaleLineStatus = 'ACTIVE' | 'VOIDED' | 'RETURNED';

export interface SaleLine {
  id: number;
  sale_uuid: string;
  
  status: SaleLineStatus;
  returned_from_sale_uuid: string | null;
  returned_from_line_id: number | null;
  
  product_id: number | null;
  barcode_used: string | null;
  description_snapshot: string;
  
  quantity: number;
  unit_price: number;
  
  // Discounts
  discount_percent: number;
  discount_amount: number;
  promotion_applied_id: number | null;
  promotion_name_snapshot: string | null;
  promotion_type_snapshot: string | null;
  promotion_discount_snapshot: number | null;
  
  // Taxes
  tax_id: number;
  tax_rate_snapshot: number;
  tax_amount: number;
  
  // Surcharge
  surcharge_rate: number;
  surcharge_amount: number;
  
  // Weight & Scale
  weight_read: number | null;
  scale_id: string | null;
  plu_prefix: string | null;
  embedded_weight: number | null;
  embedded_price: number | null;
  
  total_line: number;
}

export interface ManagerOverride {
  id: number;
  sale_uuid: string | null;
  line_id: number | null;
  manager_user_id: number;
  reason: string | null;
  timestamp: ISODateString;
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
export type FiscalEventType = 'ALTA' | 'ANULACION' | 'RECTIFICACION';

export interface FiscalChainRecord {
  id: number;
  uuid: string;
  
  sale_uuid: string;
  event_type: FiscalEventType;
  
  // Chain Security
  previous_record_hash: string;
  chain_sequence_id: number;
  fiscal_timestamp: ISODateString;
  
  // Enterprise Audit
  software_name: string;
  software_version: string;
  installation_id: string;
  device_serial: string;
  
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