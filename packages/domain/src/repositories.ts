import {
    AppSetting,
    CashMovement,
    Customer,
    FiscalChainRecord,
    Payment,
    PosConfig,
    Product,
    ProductBarcode,
    ProductPrice,
    Promotion,
    Sale,
    SaleLine,
    Shift,
    Tariff,
    Tax,
    User
} from './entities';

// ==================================================================================
// BASE GENERIC REPOSITORY
// ==================================================================================
export interface IBaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>; // Primary Key lookup
  findByUuid?(uuid: string): Promise<T | null>; // UUID lookup (optional but common)
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<number | string>; // Returns ID or UUID
  update(id: number, data: Partial<T>): Promise<void>;
  delete(id: number): Promise<void>;
}

// ==================================================================================
// SYSTEM & CONFIG
// ==================================================================================
export interface IPosConfigRepository {
  getConfig(): Promise<PosConfig | null>;
  initialize(config: PosConfig): Promise<void>;
  update(config: Partial<PosConfig>): Promise<void>;
}

export interface IAppSettingsRepository {
  getAll(): Promise<AppSetting[]>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, description?: string): Promise<void>;
}

export interface IDocumentSequenceRepository {
  /**
   * Returns the next available number for a series/year and increments the counter atomically.
   */
  getNextValue(series: string, year: number): Promise<number>;
  getCurrentValue(series: string, year: number): Promise<number>;
}

// ==================================================================================
// USER & SHIFT MANAGEMENT
// ==================================================================================
export interface IUserRepository extends IBaseRepository<User> {
  findByUsername(username: string): Promise<User | null>;
  findAllActive(): Promise<User[]>;
  verifyPin(userId: number, pin: string): Promise<boolean>;
}

export interface IShiftRepository extends IBaseRepository<Shift> {
  findOpenShiftByUserId(userId: number): Promise<Shift | null>;
  findOpenShiftByPosId(posId: string): Promise<Shift | null>;
  findAllByUserId(userId: number): Promise<Shift[]>;
  
  startShift(userId: number, posId: string, amountInitial: number): Promise<Shift>;
  closeShift(shiftUuid: string, amountCounted: number, notes?: string): Promise<Shift>;
  
  // Reporting
  getShiftSummary(shiftUuid: string): Promise<{
    expected: number;
    counted: number;
    diff: number;
    movements: CashMovement[];
  }>;
}

export interface ICashMovementRepository extends IBaseRepository<CashMovement> {
  findByShiftUuid(shiftUuid: string): Promise<CashMovement[]>;
  registerMovement(data: Omit<CashMovement, 'id' | 'created_at'>): Promise<void>;
}

// ==================================================================================
// CATALOG (PRODUCTS, TAXES, PRICES)
// ==================================================================================
export interface ITaxRepository extends IBaseRepository<Tax> {
  findAllActive(): Promise<Tax[]>;
  findDefault(): Promise<Tax | null>;
}

export interface ITariffRepository extends IBaseRepository<Tariff> {
  findAllActive(): Promise<Tariff[]>;
}

export interface IProductRepository extends IBaseRepository<Product> {
  /**
   * Joins with product_barcodes table to find the product.
   */
  findByBarcode(barcode: string): Promise<Product | null>;
  
  findByReference(uuid: string): Promise<Product | null>;
  search(query: string): Promise<Product[]>;
  findAllActive(): Promise<Product[]>;
  
  // Stock management
  updateStock(productId: number, quantityChange: number): Promise<void>;
}

export interface IProductBarcodeRepository {
  findByProduct(productId: number): Promise<ProductBarcode[]>;
  addBarcode(barcode: ProductBarcode): Promise<void>;
  removeBarcode(barcode: string): Promise<void>;
}

export interface IProductPriceRepository {
  findByProduct(productId: number): Promise<ProductPrice[]>;
  findByTariff(tariffId: number): Promise<ProductPrice[]>;
  getPrice(productId: number, tariffId: number): Promise<number | null>; // Returns simple price
  setPrice(price: ProductPrice): Promise<void>;
}

export interface IPromotionRepository extends IBaseRepository<Promotion> {
  findAllActive(): Promise<Promotion[]>;
  findApplicable(date: string): Promise<Promotion[]>;
}

// ==================================================================================
// CUSTOMERS
// ==================================================================================
export interface ICustomerRepository extends IBaseRepository<Customer> {
  search(query: string): Promise<Customer[]>;
  findByTaxId(taxId: string): Promise<Customer | null>;
  findAllActive(): Promise<Customer[]>;
}

// ==================================================================================
// SALES & COMMERCIAL
// ==================================================================================
export interface ISaleRepository extends IBaseRepository<Sale> {
  findByDateRange(startDate: string, endDate: string): Promise<Sale[]>;
  findByShiftUuid(shiftUuid: string): Promise<Sale[]>;
  findByFullReference(ref: string): Promise<Sale | null>;
  
  /**
   * Retreives the complete object graph for a sale (Header, Lines, Payments)
   */
  findFullSale(saleUuid: string): Promise<{ 
    sale: Sale; 
    lines: SaleLine[]; 
    payments: Payment[]; 
    // Tax Summary is now calculated on the fly from lines, not stored
  } | null>;
  
  /**
   * Marks a sale as "Issued" (Facturada), locks it, and generates the VeriFactu chain record.
   */
  finalizeSale(saleUuid: string): Promise<void>;
}

export interface ISaleLineRepository extends IBaseRepository<SaleLine> {
  findBySaleUuid(saleUuid: string): Promise<SaleLine[]>;
  deleteBySaleUuid(saleUuid: string): Promise<void>;
}

export interface IPaymentRepository extends IBaseRepository<Payment> {
  findBySaleUuid(saleUuid: string): Promise<Payment[]>;
}

// ==================================================================================
// VERIFACTU / FISCAL
// ==================================================================================
export interface IFiscalChainRepository extends IBaseRepository<FiscalChainRecord> {
  findBySaleUuid(saleUuid: string): Promise<FiscalChainRecord | null>;
  
  /**
   * Critical: Gets the absolute last record to calculate the next hash.
   * MUST ensure no race conditions (use database locking if needed).
   */
  getChainHead(): Promise<FiscalChainRecord | null>;
  
  /**
   * Checks if there are any gaps in 'chain_sequence_id'.
   */
  validateChainIntegrity(): Promise<boolean>;
}