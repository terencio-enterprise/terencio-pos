-- ==================================================================================
-- PROJECT: TERENCIO POS (SPAIN RETAIL/SUPERMARKET CORE)
-- VERSION: 1.3.0 (STRICT FISCAL INTEGRITY)
-- COMPLIANCE: VERIFACTU / LEY ANTIFRAUDE (11/2021) / CRITERIOS INSPECCIÓN
-- ENGINE: SQLite 3
-- MODE: High Concurrency (WAL)
-- ==================================================================================

-- 1. CRITICAL PERFORMANCE SETTINGS
PRAGMA journal_mode = WAL; -- Write-Ahead Logging (Non-blocking reads/writes)
PRAGMA foreign_keys = ON;
PRAGMA encoding = "UTF-8";
PRAGMA synchronous = NORMAL; -- Balance between speed and safety

-- ==================================================================================
-- [A] CONFIGURATION & SYSTEM
-- ==================================================================================

-- Store identification (Synced from Cloud)
CREATE TABLE IF NOT EXISTS pos_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Singleton
    pos_uuid TEXT NOT NULL,                -- The Hardware ID
    pos_serial_code TEXT NOT NULL,         -- The Fiscal ID (e.g., "TPV-01")
    store_id TEXT NOT NULL,
    license_key TEXT,
    verifactu_enabled INTEGER DEFAULT 1,
    test_mode INTEGER DEFAULT 0,           -- If 1, receipts are "SIMULACRO"
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Local App Settings (Key-Value)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    is_system INTEGER DEFAULT 0 -- If 1, UI cannot change it
);

-- ==================================================================================
-- [B] ACCESS CONTROL & STAFF
-- ==================================================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,           -- Encrypted PIN for quick login
    full_name TEXT,
    role TEXT DEFAULT 'CASHIER',      -- ADMIN, MANAGER, CASHIER
    permissions_json TEXT,            -- Specific overrides { "can_void": true }
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================================
-- [C] MASTER DATA (CATALOG & PRICING)
-- ==================================================================================

-- 1. TAXES (IVA / IGIC / REC)
CREATE TABLE IF NOT EXISTS taxes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,               -- "IVA General 21%"
    rate REAL NOT NULL,               -- 21.00
    surcharge REAL DEFAULT 0,         -- Recargo de Equivalencia (if needed)
    code_aeat TEXT,                   -- Mapping to AEAT codes
    valid_from TEXT,                  -- Historic integrity
    valid_until TEXT,
    active INTEGER DEFAULT 1
);

-- 2. PRODUCTS (The Core Item)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    reference TEXT UNIQUE,            -- Internal Ref (e.g. "REF-001")
    
    -- Display
    name TEXT NOT NULL,
    short_name TEXT,                  -- For ticket printing (20 chars)
    description TEXT,
    
    -- Categorization
    category_id INTEGER,
    family_code TEXT,
    
    -- Fiscal
    tax_id INTEGER NOT NULL,
    
    -- Logic Flags
    is_weighted INTEGER DEFAULT 0,    -- If 1, barcode contains weight (PLU logic)
    is_service INTEGER DEFAULT 0,     -- If 1, no stock tracking
    is_age_restricted INTEGER DEFAULT 0,
    requires_manager INTEGER DEFAULT 0, -- High value items
    
    -- Inventory
    stock_tracking INTEGER DEFAULT 1,
    stock_current REAL DEFAULT 0,
    min_stock_alert REAL DEFAULT 0,
    last_stock_sync TEXT,             -- SYNC: Last time cloud updated this stock
    
    -- Enterprise: Stock Reservations
    reserved_stock REAL DEFAULT 0,    -- Stock in active baskets (prevent overselling)
    
    -- Meta
    image_url TEXT,
    active INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(tax_id) REFERENCES taxes(id)
);

-- 3. THE BARCODE ENGINE (1-to-Many Relationship)
-- Handles: Standard EAN, Multipacks, Supplier Codes, PLU Prefixes
CREATE TABLE IF NOT EXISTS product_barcodes (
    barcode TEXT PRIMARY KEY,         -- The scanned string
    product_id INTEGER NOT NULL,
    
    type TEXT DEFAULT 'EAN13',        -- EAN13, EAN8, UPC, CODE128, PLU_PREFIX
    is_primary INTEGER DEFAULT 0,     -- Main code for printing labels
    
    -- Multipack Logic
    quantity_factor REAL DEFAULT 1,   -- If barcode is for a 6-pack, this is 6.
                                      -- When scanned, dedupe stock by 6 units.
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 4. PRICING & TARIFFS
CREATE TABLE IF NOT EXISTS tariffs (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,               -- "PVP General", "Empleados", "VIP"
    priority INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS product_prices (
    product_id INTEGER,
    tariff_id INTEGER,
    price REAL NOT NULL,              -- The price including tax? Usually yes in Retail.
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, tariff_id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(tariff_id) REFERENCES tariffs(id)
);

-- 5. PROMOTIONS (Flexible Engine)
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,               -- DISC_PERCENT, 3X2, MIX_MATCH
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    priority INTEGER DEFAULT 10,
    rules_json TEXT NOT NULL,         -- { "buy": ["CAT_DRINKS"], "qty": 3, "pay": 2 }
    active INTEGER DEFAULT 1
);

-- ==================================================================================
-- [D] CUSTOMERS (CRM)
-- ==================================================================================

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    tax_id TEXT,                      -- NIF / CIF / NIE
    legal_name TEXT,
    commercial_name TEXT,
    address TEXT,
    zip_code TEXT,
    email TEXT,
    phone TEXT,
    
    tariff_id INTEGER,                -- Specific price list
    allow_credit INTEGER DEFAULT 0,   -- Can they pay later?
    credit_limit REAL DEFAULT 0,
    surcharge_apply INTEGER DEFAULT 0,-- 1 = Apply Recargo de Equivalencia
    
    verifactu_ref TEXT,               -- If we need to invoice them specifically
    active INTEGER DEFAULT 1,
    
    -- Sync Logic
    sync_status TEXT DEFAULT 'PENDING',
    last_updated_server TEXT,
    
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tariff_id) REFERENCES tariffs(id)
);

-- ==================================================================================
-- [E] OPERATIONS: SHIFTS & CASH (Caja)
-- ==================================================================================

CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    pos_id TEXT NOT NULL,             -- Which hardware
    
    opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    
    amount_initial REAL DEFAULT 0,    -- Fondo de caja
    amount_system REAL DEFAULT 0,     -- Calculated from sales
    amount_counted REAL DEFAULT 0,    -- Physical count
    amount_diff REAL DEFAULT 0,       -- Discrepancy
    
    status TEXT DEFAULT 'OPEN',       -- OPEN, CLOSED, Z_REPORT_PRINTED
    
    -- Enterprise: Z Report Fiscal & Security
    z_report_number INTEGER,          -- Sequence for daily Z report
    z_series TEXT,                    -- Independent series for Z (Store/POS/Year)
    z_year INTEGER,
    z_report_hash TEXT,               -- Immutable snapshot hash of the Z report
    z_report_signature TEXT,          -- Digital signature of the Z report
    
    -- Enterprise: Reopening Audit
    reopened INTEGER DEFAULT 0,       -- Flag if shift was reopened after close
    reopened_by_user_id INTEGER,
    reopened_reason TEXT,
    
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- CASH MOVEMENTS (Entradas/Salidas de caja manuales)
CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_uuid TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,               -- IN (Cambio), OUT (Retirada/Pago Proveedor)
    amount REAL NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(shift_uuid) REFERENCES shifts(uuid),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- [NEW] Enterprise: Cash Drawer Events (Security)
CREATE TABLE IF NOT EXISTS cash_drawer_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_uuid TEXT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL, -- 'SALE_OPEN', 'MANUAL_OPEN', 'CHANGE'
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(shift_uuid) REFERENCES shifts(uuid),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- ==================================================================================
-- [F] SALES & TRANSACTIONS (The Business Core)
-- ==================================================================================

-- 1. DOCUMENT SEQUENCES (VeriFactu Gap-Free Requirement)
CREATE TABLE IF NOT EXISTS doc_sequences (
    series TEXT NOT NULL,             -- e.g., BCN01-P01-T24-0001 so [STORE][POS][TYPE][YY]
    current_value INTEGER DEFAULT 0,
    year INTEGER NOT NULL,
    PRIMARY KEY (series, year)
);

-- 2. SALES HEADER
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    global_uuid TEXT,                 -- SYNC: Universal UUID generated by POS
    
    -- Document ID
    series TEXT NOT NULL,
    number INTEGER NOT NULL,
    full_reference TEXT UNIQUE NOT NULL, -- "T24-0001"
    
    -- Legal Type
    type TEXT NOT NULL DEFAULT 'SIMPLIFIED', -- 'SIMPLIFIED' (Ticket) or 'FULL' (Factura)
    billing_upgraded_from_simplified INTEGER DEFAULT 0, -- [NEW] Flag for "Canje" tickets
    
    -- Timing
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, -- Start of basket
    issued_at TEXT,                            -- Finalization (Fiscal Date)
    
    -- Context
    shift_uuid TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    customer_id INTEGER,              -- NULL = Anonymous
    
    -- Status
    status TEXT DEFAULT 'DRAFT',      -- DRAFT, COMPLETED, RECTIFIED (Anulada)
    is_fiscal_issued INTEGER DEFAULT 0, -- 1 = Locked & Chained
    
    -- Rectification / Void Logic (Enterprise Structured)
    rectifies_uuid TEXT,
    rectification_reason TEXT,        -- Legacy description
    void_reason_code TEXT,            -- [NEW] Catalog code (e.g., ERR-01, RET-05)
    void_reason_text TEXT,            -- [NEW] Catalog description
    
    -- Operational Audit
    print_count INTEGER DEFAULT 0,    -- [NEW] Anti-fraud: Track reprints
    last_printed_at TEXT,
    
    -- Financials
    total_net REAL NOT NULL DEFAULT 0,
    total_tax REAL NOT NULL DEFAULT 0,
    total_surcharge REAL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    
    -- Verification
    qr_data TEXT,                     -- The VeriFactu QR string
    
    -- Sync Logic
    sync_status TEXT DEFAULT 'PENDING', -- PENDING, SYNCED, ERROR
    server_id INTEGER,                -- ID assigned by Cloud
    
    FOREIGN KEY(shift_uuid) REFERENCES shifts(uuid),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);

-- 3. BILLING SNAPSHOT (If type='FULL')
CREATE TABLE IF NOT EXISTS sale_billing_info (
    sale_uuid TEXT PRIMARY KEY,
    
    -- Data snapshot at moment of sale (Immutable)
    customer_legal_name TEXT NOT NULL, 
    customer_nif TEXT NOT NULL,        
    customer_address TEXT,
    customer_city TEXT,
    customer_zip TEXT,
    customer_country TEXT DEFAULT 'ES',
    
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid)
);

-- 4. SALE LINES
CREATE TABLE IF NOT EXISTS sale_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_uuid TEXT NOT NULL,
    
    -- Enterprise: Line Status & Traceability
    status TEXT DEFAULT 'ACTIVE',     -- [NEW] 'ACTIVE', 'VOIDED', 'RETURNED'
    returned_from_sale_uuid TEXT,     -- [NEW] Reference origin for returns
    returned_from_line_id INTEGER,
    
    product_id INTEGER,
    barcode_used TEXT,                -- To know if they scanned the 6-pack or single
    description_snapshot TEXT NOT NULL, -- Immutable name at time of sale
    
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,         -- Price per unit
    
    -- Discounts & Promo Snapshot (Enterprise)
    discount_percent REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    promotion_applied_id INTEGER,
    promotion_name_snapshot TEXT,     -- [NEW] Snapshot of promo rule used
    promotion_type_snapshot TEXT,
    promotion_discount_snapshot REAL,
    
    -- Taxes (Snapshot is vital for compliance)
    tax_id INTEGER NOT NULL,
    tax_rate_snapshot REAL NOT NULL,
    tax_amount REAL NOT NULL,
    
    -- Surcharge (Recargo Equivalencia)
    surcharge_rate REAL DEFAULT 0,
    surcharge_amount REAL DEFAULT 0,
    
    -- Enterprise: Weight & Scale Data (Frescos)
    weight_read REAL,                 -- [NEW] Exact weight from scale
    scale_id TEXT,                    -- [NEW] Scale identifier for audit
    plu_prefix TEXT,                  -- [NEW] Parsed PLU prefix
    embedded_weight REAL,             -- [NEW] Weight parsed from barcode
    embedded_price REAL,              -- [NEW] Price parsed from barcode
    
    total_line REAL NOT NULL,
    
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid),
    FOREIGN KEY(promotion_applied_id) REFERENCES promotions(id)
);

-- [NEW] Enterprise: Manager Overrides Log
CREATE TABLE IF NOT EXISTS manager_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_uuid TEXT,
    line_id INTEGER,
    manager_user_id INTEGER NOT NULL,
    reason TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid),
    FOREIGN KEY(manager_user_id) REFERENCES users(id)
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_uuid TEXT NOT NULL,
    method TEXT NOT NULL,             -- CASH, CARD, VOUCHER, CREDIT
    amount REAL NOT NULL,
    details_json TEXT,                -- { "auth_code": "12345", "card_last4": "4242" }
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid)
);

-- ==================================================================================
-- [G] VERIFACTU CORE (The Fiscal Ledger)
-- ==================================================================================
-- This table is the "Alta" and "Anulación" ledger.
-- It MUST be chain-linked. No rows can be deleted.

CREATE TABLE IF NOT EXISTS fiscal_chain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    
    sale_uuid TEXT NOT NULL,
    event_type TEXT NOT NULL,         -- 'ALTA', 'ANULACION', 'RECTIFICACION'
    
    -- Chain Security
    previous_record_hash TEXT NOT NULL, -- The hash of the row with id-1 (Per Device)
    chain_sequence_id INTEGER NOT NULL, -- Sequential counter for checking gaps
    fiscal_timestamp TEXT NOT NULL,     -- [NEW] Immutable timestamp used for hashing
    
    -- Enterprise: Software Identification Snapshot (AEAT Requirement)
    software_name TEXT NOT NULL,        -- [NEW] Exact software name
    software_version TEXT NOT NULL,     -- [NEW] Version at time of signature
    installation_id TEXT NOT NULL,      -- [NEW] Installation/License ID
    device_serial TEXT NOT NULL,        -- [NEW] Physical Device Serial
    
    -- Data Snapshot (What is being signed)
    issuer_nif TEXT NOT NULL,
    invoice_series TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    invoice_amount REAL NOT NULL,
    
    -- Cryptography
    record_hash TEXT NOT NULL,        -- SHA-256 of this record
    signature TEXT,                   -- Digital signature (Certificado Digital)
    system_fingerprint TEXT,          -- "Huella" of the software
    
    -- Sync Status with AEAT
    sent_to_aeat INTEGER DEFAULT 0,
    aeat_csv TEXT,                    -- Código Seguro Verificación returned
    aeat_response_json TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid)
);

-- ==================================================================================
-- [H] INDEXES & OPTIMIZATION
-- ==================================================================================

-- Product Lookup Speed
CREATE INDEX idx_barcode_lookup ON product_barcodes(barcode);
CREATE INDEX idx_products_search ON products(name);
CREATE INDEX idx_products_family ON products(family_code);

-- Operational Speed
CREATE INDEX idx_sales_full_ref ON sales(full_reference);
CREATE INDEX idx_sales_date ON sales(issued_at);
CREATE INDEX idx_sales_shift ON sales(shift_uuid);
CREATE INDEX idx_sales_sync ON sales(sync_status);
CREATE INDEX idx_lines_sale ON sale_lines(sale_uuid);
CREATE INDEX idx_lines_status ON sale_lines(status); -- [NEW] For active/void analysis

-- Fiscal Integrity
CREATE INDEX idx_fiscal_chain_hash ON fiscal_chain(record_hash);
CREATE INDEX idx_fiscal_prev_hash ON fiscal_chain(previous_record_hash);

-- [NEW] Strict Gap & Audit Controls
CREATE UNIQUE INDEX uq_fiscal_chain_seq ON fiscal_chain(installation_id, device_serial, chain_sequence_id);
CREATE INDEX idx_fiscal_chain_device_time ON fiscal_chain(device_serial, fiscal_timestamp);

-- ==================================================================================
-- [I] TRIGGERS (THE ENFORCERS - SAFETY ONLY)
-- ==================================================================================

-- 1. PREVENT TAMPERING WITH FISCAL CHAIN (RESTRICTION)
CREATE TRIGGER security_fiscal_chain_no_update
BEFORE UPDATE ON fiscal_chain
BEGIN
    SELECT RAISE(ABORT, 'FATAL: Fiscal Chain records are immutable (VeriFactu Compliance).');
END;

CREATE TRIGGER security_fiscal_chain_no_delete
BEFORE DELETE ON fiscal_chain
BEGIN
    SELECT RAISE(ABORT, 'FATAL: Fiscal Chain records cannot be deleted (VeriFactu Compliance).');
END;

-- 2. LOCK SALE AFTER ISSUANCE (RESTRICTION)
CREATE TRIGGER security_sales_lock_issued
BEFORE UPDATE ON sales
WHEN OLD.is_fiscal_issued = 1 AND NEW.is_fiscal_issued = 1
BEGIN
    -- Block any modification to critical fiscal fields after issuance
    SELECT CASE 
        -- 1. Financials Integrity
        WHEN NEW.total_amount != OLD.total_amount OR
             NEW.total_net != OLD.total_net OR
             NEW.total_tax != OLD.total_tax OR
             NEW.total_surcharge != OLD.total_surcharge THEN
             RAISE(ABORT, 'Illegal: Cannot change financial amounts of issued invoice.')
             
        -- 2. Document Identity Integrity
        WHEN NEW.full_reference != OLD.full_reference OR
             NEW.series != OLD.series OR
             NEW.number != OLD.number THEN
             RAISE(ABORT, 'Illegal: Cannot change document reference of issued invoice.')
             
        -- 3. Fiscal Context Integrity
        WHEN NEW.issued_at != OLD.issued_at OR
             NEW.customer_id IS NOT OLD.customer_id OR
             NEW.type != OLD.type THEN
             RAISE(ABORT, 'Illegal: Cannot change fiscal context (Date/Customer/Type) of issued invoice.')
             
        -- 4. Audit Integrity
        WHEN NEW.void_reason_code != OLD.void_reason_code OR
             NEW.rectifies_uuid != OLD.rectifies_uuid THEN
             RAISE(ABORT, 'Illegal: Cannot change audit reasons of issued invoice.')
    END;
END;

-- 3. UPDATE TIMESTAMPS (SAFE PATTERN - NO RECURSION)
-- Only update if the application did not provide a new updated_at
-- Uses '=' for strict comparison as timestamps are NOT NULL by default
CREATE TRIGGER trg_upd_products 
AFTER UPDATE ON products
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_upd_customers 
AFTER UPDATE ON customers
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;