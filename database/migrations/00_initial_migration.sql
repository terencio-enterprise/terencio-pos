-- ==================================================================================
-- MIGRACIÓN 00: CORE TERENCIO POS (VeriFactu / Ley Antifraude - PURE CORE)
-- Motor: SQLite 3
-- Enfoque: Estructura mínima legal para inmutabilidad y encadenamiento.
-- ==================================================================================

PRAGMA foreign_keys = ON;

-- 1. CONFIGURACIÓN LOCAL Y METADATOS DE SOFTWARE
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
);

-- 2. USUARIOS
CREATE TABLE IF NOT EXISTS users (
    uuid TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    pin_hash TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'CASHIER',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

-- 3. TURNOS (CAJA)
CREATE TABLE IF NOT EXISTS shifts (
    uuid TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    device_id TEXT,
    start_time TEXT DEFAULT CURRENT_TIMESTAMP,
    end_time TEXT,
    starting_cash REAL DEFAULT 0,
    expected_cash REAL DEFAULT 0,
    counted_cash REAL DEFAULT 0,
    discrepancy REAL DEFAULT 0,
    status TEXT DEFAULT 'OPEN',
    notes TEXT,
    synced INTEGER DEFAULT 0,
    FOREIGN KEY(user_uuid) REFERENCES users(uuid)
);

-- 4. IMPUESTOS
CREATE TABLE IF NOT EXISTS taxes (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rate REAL NOT NULL CHECK(rate >= 0),
    is_default INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

-- 5. TARIFAS (LISTAS DE PRECIOS)
CREATE TABLE IF NOT EXISTS tariffs (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_tax_included INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

-- 6. CLIENTES
CREATE TABLE IF NOT EXISTS customers (
    uuid TEXT PRIMARY KEY,
    code TEXT,
    tax_id TEXT,
    business_name TEXT,
    trade_name TEXT,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    email TEXT,
    phone TEXT,
    tariff_uuid TEXT,                  -- VINCULACIÓN DE PRECIO (RETAIL / SOCIO)
    is_credit_allowed INTEGER DEFAULT 0,
    tier_level TEXT,
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    FOREIGN KEY(tariff_uuid) REFERENCES tariffs(uuid)
);

-- 7. PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
    uuid TEXT PRIMARY KEY,
    reference TEXT UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tax_uuid TEXT NOT NULL,
    requires_weight INTEGER DEFAULT 0,
    is_discountable INTEGER DEFAULT 1,
    is_refundable INTEGER DEFAULT 1,
    age_restriction INTEGER DEFAULT 0,
    image_path TEXT,
    stock_control INTEGER DEFAULT 1,
    stock_current REAL DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    FOREIGN KEY(tax_uuid) REFERENCES taxes(uuid)
);

-- 8. PRECIOS DE PRODUCTOS
CREATE TABLE IF NOT EXISTS product_prices (
    product_uuid TEXT,
    tariff_uuid TEXT,
    price REAL NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_uuid, tariff_uuid),
    FOREIGN KEY(product_uuid) REFERENCES products(uuid),
    FOREIGN KEY(tariff_uuid) REFERENCES tariffs(uuid)
);

-- 9. PROMOCIONES
CREATE TABLE IF NOT EXISTS promotions (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    priority INTEGER DEFAULT 0,
    rules_json TEXT,
    active INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

-- 10. VENTAS (CABECERA COMERCIAL)
CREATE TABLE IF NOT EXISTS sales (
    uuid TEXT PRIMARY KEY,
    
    -- Identificación Documental
    doc_series TEXT NOT NULL,
    doc_number INTEGER NOT NULL,
    doc_full_id TEXT UNIQUE NOT NULL,
    
    doc_type TEXT DEFAULT 'FV',
    issue_date TEXT NOT NULL,
    
    -- Estado
    is_issued INTEGER DEFAULT 0,       -- 0: Borrador, 1: Emitida (Bloqueada)
    status TEXT DEFAULT 'COMPLETED',   -- COMPLETED, CANCELLED
    
    -- Rectificación
    rectification_type TEXT,
    rectified_sale_uuid TEXT,
    
    -- Contexto
    shift_uuid TEXT,
    customer_uuid TEXT,
    user_uuid TEXT NOT NULL,
    
    -- Totales
    total_net REAL NOT NULL,
    total_taxes REAL NOT NULL,
    total_amount REAL NOT NULL,
    
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(shift_uuid) REFERENCES shifts(uuid),
    FOREIGN KEY(customer_uuid) REFERENCES customers(uuid),
    FOREIGN KEY(user_uuid) REFERENCES users(uuid),
    FOREIGN KEY(rectified_sale_uuid) REFERENCES sales(uuid)
);

-- 11. REGISTROS FISCALES (CORE VERIFACTU)
-- Ledger inmutable de encadenamiento.
CREATE TABLE IF NOT EXISTS fiscal_records (
    uuid TEXT PRIMARY KEY,
    sale_uuid TEXT NOT NULL,
    
    -- Trazabilidad estricta
    fiscal_sequence INTEGER NOT NULL,  -- Contador incremental fiscal
    record_type TEXT NOT NULL,         -- 'ALTA', 'ANULACION'
    
    -- Integridad Criptográfica
    previous_hash TEXT NOT NULL,       -- NULL solo en Génesis
    hash TEXT NOT NULL,                -- SHA-256
    fingerprint TEXT NOT NULL,         -- Huella origen
    signature TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid),
    UNIQUE(sale_uuid, record_type)
);

-- 12. LÍNEAS DE VENTA
CREATE TABLE IF NOT EXISTS sale_lines (
    uuid TEXT PRIMARY KEY,
    sale_uuid TEXT NOT NULL,
    product_uuid TEXT,
    product_name TEXT NOT NULL,
    
    quantity REAL NOT NULL CHECK(quantity != 0),
    unit_price REAL NOT NULL,
    
    -- Snapshot Fiscal
    tax_uuid TEXT,
    tax_rate REAL NOT NULL,
    tax_amount REAL NOT NULL DEFAULT 0,
    
    discount_percent REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    promotion_uuid TEXT,
    
    total_line REAL NOT NULL,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid) ON DELETE RESTRICT,
    FOREIGN KEY(promotion_uuid) REFERENCES promotions(uuid)
);

-- 13. RESUMEN DE IMPUESTOS (SNAPSHOT)
CREATE TABLE IF NOT EXISTS sale_tax_summary (
    sale_uuid TEXT NOT NULL,
    tax_uuid TEXT,
    tax_name_snapshot TEXT NOT NULL,
    tax_rate_snapshot REAL NOT NULL,
    base_amount REAL NOT NULL,
    tax_amount REAL NOT NULL,
    PRIMARY KEY (sale_uuid, tax_rate_snapshot),
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid) ON DELETE RESTRICT
);

-- 14. PAGOS
CREATE TABLE IF NOT EXISTS payments (
    uuid TEXT PRIMARY KEY,
    sale_uuid TEXT NOT NULL,
    method TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_uuid) REFERENCES sales(uuid)
);

-- 15. SECUENCIAS DE DOCUMENTOS
-- Necesario para garantizar doc_number gap-free
CREATE TABLE IF NOT EXISTS document_sequences (
    series TEXT NOT NULL,
    device_id TEXT NOT NULL DEFAULT 'MAIN',
    current_value INTEGER DEFAULT 0,
    PRIMARY KEY (device_id, series)
);

-- ==================================================================================
-- ÍNDICES
-- ==================================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_series_number ON sales(doc_series, doc_number);

-- Índices Fiscales
CREATE INDEX IF NOT EXISTS idx_fiscal_records_sale ON fiscal_records(sale_uuid);
CREATE INDEX IF NOT EXISTS idx_fiscal_records_hash ON fiscal_records(hash);
CREATE INDEX IF NOT EXISTS idx_fiscal_records_created ON fiscal_records(created_at);
CREATE INDEX IF NOT EXISTS idx_fiscal_records_sequence ON fiscal_records(fiscal_sequence);

-- Índices Operativos
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sale_lines_sale ON sale_lines(sale_uuid);

-- ==================================================================================
-- TRIGGERS DE SEGURIDAD, INMUTABILIDAD Y CUMPLIMIENTO
-- ==================================================================================

-- 1. Actualización de timestamps
CREATE TRIGGER IF NOT EXISTS trg_products_upd AFTER UPDATE ON products
BEGIN UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid; END;
CREATE TRIGGER IF NOT EXISTS trg_customers_upd AFTER UPDATE ON customers
BEGIN UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid; END;
CREATE TRIGGER IF NOT EXISTS trg_tariffs_upd AFTER UPDATE ON tariffs
BEGIN UPDATE tariffs SET updated_at = CURRENT_TIMESTAMP WHERE uuid = NEW.uuid; END;

-- 2. INMUTABILIDAD ABSOLUTA DE REGISTROS FISCALES
CREATE TRIGGER IF NOT EXISTS trg_fiscal_records_no_update
BEFORE UPDATE ON fiscal_records
BEGIN
  SELECT RAISE(ABORT, 'FATAL: El registro fiscal es inmutable por ley.');
END;

CREATE TRIGGER IF NOT EXISTS trg_fiscal_records_no_delete
BEFORE DELETE ON fiscal_records
BEGIN
  SELECT RAISE(ABORT, 'FATAL: El borrado de registros fiscales es ilegal.');
END;

-- 3. INTEGRIDAD VENTA <-> REGISTRO FISCAL
CREATE TRIGGER IF NOT EXISTS trg_sales_require_fiscal_record
BEFORE UPDATE OF is_issued ON sales
WHEN NEW.is_issued = 1
BEGIN
  SELECT CASE 
    WHEN (SELECT COUNT(*) FROM fiscal_records WHERE sale_uuid = NEW.uuid AND record_type = 'ALTA') = 0 
    THEN RAISE(ABORT, 'Integridad Violada: No se puede emitir venta sin registro fiscal de ALTA.')
  END;
END;

-- 4. BLOQUEOS EN VENTAS (COMERCIAL)
CREATE TRIGGER IF NOT EXISTS trg_sales_no_update_when_issued
BEFORE UPDATE ON sales
WHEN OLD.is_issued = 1
BEGIN
  SELECT RAISE(ABORT, 'Error: Venta emitida es inmutable.');
END;

CREATE TRIGGER IF NOT EXISTS trg_sales_no_unissue
BEFORE UPDATE ON sales
WHEN OLD.is_issued = 1 AND NEW.is_issued = 0
BEGIN
  SELECT RAISE(ABORT, 'Error: No se puede revertir el estado de emisión.');
END;

CREATE TRIGGER IF NOT EXISTS trg_sales_no_delete
BEFORE DELETE ON sales
BEGIN
  SELECT RAISE(ABORT, 'Error: Las ventas no pueden ser eliminadas.');
END;

-- 5. BLOQUEOS EN LÍNEAS Y PAGOS
CREATE TRIGGER IF NOT EXISTS trg_sale_lines_no_modify_issued
BEFORE UPDATE ON sale_lines
WHEN (SELECT is_issued FROM sales WHERE uuid = OLD.sale_uuid) = 1
BEGIN SELECT RAISE(ABORT, 'Error: Líneas inmutables tras emisión.'); END;

CREATE TRIGGER IF NOT EXISTS trg_sale_lines_no_delete_issued
BEFORE DELETE ON sale_lines
WHEN (SELECT is_issued FROM sales WHERE uuid = OLD.sale_uuid) = 1
BEGIN SELECT RAISE(ABORT, 'Error: Líneas inmutables tras emisión.'); END;

CREATE TRIGGER IF NOT EXISTS trg_payments_no_modify_issued
BEFORE UPDATE ON payments
WHEN (SELECT is_issued FROM sales WHERE uuid = OLD.sale_uuid) = 1
BEGIN SELECT RAISE(ABORT, 'Error: Pagos inmutables tras emisión.'); END;

CREATE TRIGGER IF NOT EXISTS trg_payments_no_delete_issued
BEFORE DELETE ON payments
WHEN (SELECT is_issued FROM sales WHERE uuid = OLD.sale_uuid) = 1
BEGIN SELECT RAISE(ABORT, 'Error: Pagos inmutables tras emisión.'); END;
