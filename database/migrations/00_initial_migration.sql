-- ==================================================================================
-- MIGRATION 00: TERENCIO POS INITIALIZATION (The Armored POS)
-- Engine: SQLite 3
-- Goal: Offline-First, Grocery/Retail Ready, Shift Management, Outbox Sync
-- ==================================================================================

PRAGMA foreign_keys = ON;

-- 1. LOCAL DEVICE CONFIGURATION
-- Stores the state of this specific terminal (Store ID, Terminal ID, Hardware config)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
);

-- 2. USERS (CASHIERS / MANAGERS)
-- Supports offline login via PIN hash.
CREATE TABLE IF NOT EXISTS users (
    uuid TEXT PRIMARY KEY,             -- Fixed codes for Admin (e.g. 'USER_ADMIN'), UUID for new users
    username TEXT UNIQUE NOT NULL,
    pin_hash TEXT,                     -- Security: Hash of the PIN (never plain text)
    full_name TEXT,
    role TEXT DEFAULT 'CASHIER',       -- 'ADMIN', 'MANAGER', 'CASHIER'
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT                    -- Soft Delete for sync
);

-- 3. SHIFTS (CASH CONTROL)
-- Essential for "Grocery Store" operations. Tracks cash drawer lifecycle.
-- UUID STRATEGY: Generative (Random UUIDv4)
CREATE TABLE IF NOT EXISTS shifts (
    uuid TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,           -- Who opened the shift
    device_id TEXT,                    -- Terminal ID
    start_time TEXT DEFAULT CURRENT_TIMESTAMP,
    end_time TEXT,                     -- NULL = Shift is OPEN
    
    starting_cash REAL DEFAULT 0,      -- The "Float" in the drawer
    expected_cash REAL DEFAULT 0,      -- Calculated by system (Start + Cash Sales - Refunds)
    counted_cash REAL DEFAULT 0,       -- Blind count entered by cashier at close
    discrepancy REAL DEFAULT 0,        -- Difference
    
    status TEXT DEFAULT 'OPEN',        -- 'OPEN', 'CLOSED'
    notes TEXT,
    
    synced INTEGER DEFAULT 0,
    FOREIGN KEY(user_uuid) REFERENCES users(uuid)
);

-- 4. TAXES (GENERIC / VAT / IGIC)
-- Tax engine is data-driven.
-- UUID STRATEGY: Fixed Codes (e.g., 'TAX_ES_IGIC_GEN') to ensure global consistency without syncing map.
CREATE TABLE IF NOT EXISTS taxes (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,                -- Ex: "VAT Standard", "VAT Reduced"
    rate REAL NOT NULL CHECK(rate >= 0), -- Constraint: Rate cannot be negative
    is_default INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

-- 5. TARIFFS (PRICE LISTS)
-- Supports dual pricing (Retail vs Professional/VIP)
-- UUID STRATEGY: Fixed Codes (e.g., 'TARIFF_RETAIL')
CREATE TABLE IF NOT EXISTS tariffs (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,                -- Ex: "Retail", "VIP Member"
    is_tax_included INTEGER DEFAULT 1, -- 1: Prices show tax included (B2C), 0: Base prices (B2B)
    priority INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

-- 6. CUSTOMERS / MEMBERSHIPS
-- Minimal local data for offline identification.
-- UUID STRATEGY: Fixed Code for Anonymous ('CUST_ANON'), Generative UUID for others.
CREATE TABLE IF NOT EXISTS customers (
    uuid TEXT PRIMARY KEY,
    code TEXT,                         -- Member ID / Internal Code
    tax_id TEXT,                       -- VAT ID / NIF / DNI
    business_name TEXT,                -- Full Legal Name
    trade_name TEXT,                   -- Display Name
    address TEXT,
    city TEXT,
    zip_code TEXT,
    email TEXT,
    phone TEXT,                        -- For quick lookup
    tariff_uuid TEXT,                  -- Assigned Price List (Member Tier)
    
    -- Flags & Policy
    is_credit_allowed INTEGER DEFAULT 0,
    tier_level TEXT,                   -- Ex: 'GOLD', 'SILVER'
    notes TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    FOREIGN KEY(tariff_uuid) REFERENCES tariffs(uuid)
);

-- 7. PRODUCTS (LOCAL CACHE)
-- Expanded for Grocery features (Weight, Age Restriction)
-- UUID STRATEGY: Generative UUID (synced from Core)
CREATE TABLE IF NOT EXISTS products (
    uuid TEXT PRIMARY KEY,
    reference TEXT UNIQUE,             -- Internal SKU
    barcode TEXT,                      -- EAN13 / UPC. Primary lookup.
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,                     -- Simple grouping
    
    tax_uuid TEXT NOT NULL,            -- Link to tax rate
    
    -- Grocery & POS Flags
    requires_weight INTEGER DEFAULT 0, -- 1: Triggers scale reading or manual weight input
    is_discountable INTEGER DEFAULT 1, -- 0: Excluded from general discounts
    is_refundable INTEGER DEFAULT 1,
    age_restriction INTEGER DEFAULT 0, -- Min age (e.g., 18 for alcohol)
    
    image_path TEXT,                   -- Local cache path
    stock_control INTEGER DEFAULT 1,
    stock_current REAL DEFAULT 0,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    FOREIGN KEY(tax_uuid) REFERENCES taxes(uuid)
);

-- 8. PRODUCT PRICES
CREATE TABLE IF NOT EXISTS product_prices (
    product_uuid TEXT,
    tariff_uuid TEXT,
    price REAL NOT NULL,               -- The monetary value
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_uuid, tariff_uuid),
    FOREIGN KEY(product_uuid) REFERENCES products(uuid),
    FOREIGN KEY(tariff_uuid) REFERENCES tariffs(uuid)
);

-- 9. PROMOTIONS (RULES ENGINE)
-- Supports "2 for X", "Buy 3 Get 1 Free"
-- UUID STRATEGY: Generative UUID
CREATE TABLE IF NOT EXISTS promotions (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,                -- Ex: "3x2 Sodas"
    type TEXT NOT NULL,                -- 'SIMPLE_DISCOUNT', 'MULTIBUY', 'BUNDLE'
    start_date TEXT,
    end_date TEXT,
    priority INTEGER DEFAULT 0,
    rules_json TEXT,                   -- JSON logic for the rule (e.g., { "buy": 3, "pay": 2 })
    is_active INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

-- 10. SALES HEADERS (TICKETS)
-- Handles Parked sales and Invoices
-- UUID STRATEGY: Generative UUID (Random v4)
CREATE TABLE IF NOT EXISTS sales (
    uuid TEXT PRIMARY KEY,
    doc_number TEXT NOT NULL,          -- Generated Series (TPV01-2026-0001)
    doc_type TEXT DEFAULT 'TICKET',    -- 'TICKET', 'INVOICE', 'REFUND'
    
    -- Context
    shift_uuid TEXT,                   -- Links sale to a specific shift
    customer_uuid TEXT,                -- NULL = Walk-in
    user_uuid TEXT NOT NULL,           -- Cashier
    original_sale_uuid TEXT,           -- For Refunds: Links to original ticket
    
    -- Totals (Snapshot)
    total_net REAL NOT NULL,           -- Net Base
    total_taxes REAL NOT NULL,         -- Tax Amount
    total_amount REAL NOT NULL,        -- Grand Total
    
    -- Status
    status TEXT DEFAULT 'COMPLETED',   -- 'PARKED', 'COMPLETED', 'VOIDED', 'REFUNDED'
    notes TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(shift_uuid) REFERENCES shifts(uuid),
    FOREIGN KEY(customer_uuid) REFERENCES customers(uuid),
    FOREIGN KEY(user_uuid) REFERENCES users(uuid)
);

-- 11. SALE LINES
-- UUID STRATEGY: Generative UUID
CREATE TABLE IF NOT EXISTS sale_lines (
    uuid TEXT PRIMARY KEY,
    sale_uuid TEXT NOT NULL,
    product_uuid TEXT,
    product_name TEXT NOT NULL,        -- Snapshot name
    
    quantity REAL NOT NULL CHECK(quantity != 0), -- Constraint: Cannot sell 0 items
    unit_price REAL NOT NULL,          -- Applied unit price
    tax_rate REAL NOT NULL,
    
    -- Discounts & Promos
    discount_percent REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    promotion_uuid TEXT,               -- Link if a specific promo was applied
    
    total_line REAL NOT NULL,          -- Final line total
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid) ON DELETE CASCADE,
    FOREIGN KEY(promotion_uuid) REFERENCES promotions(uuid)
);

-- 12. PAYMENTS
-- UUID STRATEGY: Generative UUID
CREATE TABLE IF NOT EXISTS payments (
    uuid TEXT PRIMARY KEY,
    sale_uuid TEXT NOT NULL,
    method TEXT NOT NULL,              -- 'CASH', 'CARD' (Mark only), 'SPLIT'
    amount REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid)
);

-- 13. OUTBOX EVENTS (SYNC ENGINE)
-- Implements the "Reliable sync" requirement.
-- Every business action is an event here.
-- UUID STRATEGY: Generative UUID
CREATE TABLE IF NOT EXISTS outbox_events (
    event_id TEXT PRIMARY KEY,         -- UUID
    device_id TEXT,
    event_type TEXT NOT NULL,          -- 'TICKET_CLOSED', 'SHIFT_CLOSED', 'REFUND_ISSUED'
    payload TEXT NOT NULL,             -- JSON Data
    occurred_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'PENDING',     -- 'PENDING', 'SENT', 'FAILED'
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);

-- 14. DOCUMENT SEQUENCES
-- Ensures offline sequential numbering
CREATE TABLE IF NOT EXISTS document_sequences (
    series TEXT PRIMARY KEY,           -- Ex: 'TICKET-2026', 'INVOICE-2026'
    current_value INTEGER DEFAULT 0
);

-- ==================================================================================
-- TRIGGERS (AUTO UPDATE updated_at)
-- ==================================================================================

CREATE TRIGGER IF NOT EXISTS trg_products_upd AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid;
END;

CREATE TRIGGER IF NOT EXISTS trg_customers_upd AFTER UPDATE ON customers
BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid;
END;

CREATE TRIGGER IF NOT EXISTS trg_tariffs_upd AFTER UPDATE ON tariffs
BEGIN
    UPDATE tariffs SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid;
END;

-- ==================================================================================
-- SYSTEM SEED DATA (ESSENTIAL FOR BOOTSTRAP ONLY)
-- Using FIXED CODES for Infrastructure data to allow backend decoupling.
-- ==================================================================================

-- 1. App Settings (Placeholders to be filled by Setup Wizard)
INSERT OR IGNORE INTO app_settings (key, value, description) VALUES 
('store_id', 'PENDING_SETUP', 'Main Branch ID UUID'),
('device_id', 'PENDING_SETUP', 'Terminal Identifier UUID'),
('sync_endpoint', 'https://PENDING_SETUP/v1/sync', 'Core Sync URL'),

-- Hardware Configuration (Peripherals)
('hw_printer_ticket', 'DEFAULT', 'Thermal Printer Name (OS)'),
('hw_printer_invoice', 'DEFAULT', 'A4 Printer Name (OS)'),
('hw_scale_port', 'COM1', 'Serial Port for Scale (e.g. COM1, /dev/ttyUSB0)'),
('hw_scale_protocol', 'RETO', 'Scale Protocol (RETO, SAMSUNG, CAS, TISA)'),
('hw_scanner_mode', 'KEYBOARD', 'Scanner Input Mode (KEYBOARD, SERIAL)');

-- 2. Taxes (Official Spanish Tax Codes - Canary Islands Context)
-- Using EXPLICIT CODES, not random UUIDs. Decouples from DB internal IDs.
INSERT OR IGNORE INTO taxes (uuid, name, rate, is_default) VALUES 
('TAX_ES_IGIC_GEN', 'IGIC General (7%)', 7.00, 1),
('TAX_ES_IGIC_RED', 'IGIC Reducido (3%)', 3.00, 0),
('TAX_ES_IGIC_ZERO', 'IGIC Cero (0%)', 0.00, 0);

-- 3. Tariffs (Standard B2C vs B2B Models)
-- Using EXPLICIT CODES.
INSERT OR IGNORE INTO tariffs (uuid, name, is_tax_included, priority) VALUES 
('TARIFF_B2C_RETAIL', 'Retail Price (Tax Inc)', 1, 1),   -- Shelf Price
('TARIFF_B2B_PRO', 'Professional / Wholesale', 0, 2);    -- Base Price

-- 4. Default Anonymous Customer (Required for Walk-in Sales)
INSERT OR IGNORE INTO customers (uuid, code, business_name, tariff_uuid) VALUES 
('CUST_ANONYMOUS', '000000', 'CLIENTE CONTADO / ANONYMOUS', 'TARIFF_B2C_RETAIL');

-- 5. Bootstrapping User (Admin)
INSERT OR IGNORE INTO users (uuid, username, full_name, role, pin_hash) VALUES 
('USER_BOOTSTRAP_ADMIN', 'admin', 'System Administrator', 'ADMIN', '1234'); 

-- ==================================================================================
-- END OF MIGRATION
-- ==================================================================================