import {
    AppSetting,
    CashDrawerEvent,
    CashMovement,
    Customer,
    FiscalChainRecord,
    ManagerOverride,
    Payment,
    PosConfig,
    Product,
    ProductBarcode,
    ProductPrice,
    Promotion,
    Sale,
    SaleBillingInfo,
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
  getConfiguration(): Promise<PosConfig | null>;
  saveConfiguration(config: PosConfig): Promise<void>;
  updateLastSync(): Promise<void>;
  isRegistered(): Promise<boolean>;
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
  authenticateWithPin(username: string, pin: string): Promise<User | null>;
  updatePin(userId: number, newPin: string): Promise<void>;
}

export interface IShiftRepository extends IBaseRepository<Shift> {
  findOpenShiftByUserId(userId: number): Promise<Shift | null>;
  findAllByUserId(userId: number): Promise<Shift[]>;
  
  startShift(userId: number, posId: string, amountInitial: number): Promise<Shift>;
  endShift(shiftUuid: string, amountCounted: number, notes?: string): Promise<Shift>;
  autoCloseShift(shiftUuid: string): Promise<Shift>;
}

export interface ICashMovementRepository extends IBaseRepository<CashMovement> {
  findByShiftUuid(shiftUuid: string): Promise<CashMovement[]>;
  registerMovement(data: Omit<CashMovement, 'id' | 'created_at'>): Promise<void>;
}

export interface ICashDrawerEventRepository extends IBaseRepository<CashDrawerEvent> {
  findByShiftUuid(shiftUuid: string): Promise<CashDrawerEvent[]>;
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
  
  // Stock management (Manual updates now required)
  updateStock(productId: number, quantityChange: number): Promise<void>;
}

export interface IProductBarcodeRepository {
  findByProduct(productId: number): Promise<ProductBarcode[]>;
  findByBarcode(barcode: string): Promise<ProductBarcode | null>;
}

export interface IProductPriceRepository {
  findByProduct(productId: number): Promise<ProductPrice[]>;
  findByTariff(tariffId: number): Promise<ProductPrice[]>;
  getPrice(productId: number, tariffId: number): Promise<ProductPrice | null>; 
  setPrice(price: ProductPrice): Promise<void>;
}

export interface IPromotionRepository extends IBaseRepository<Promotion> {
  findAllActive(): Promise<Promotion[]>;
}

// ==================================================================================
// CUSTOMERS
// ==================================================================================
export interface ICustomerRepository extends IBaseRepository<Customer> {
  search(query: string): Promise<Customer[]>;
  findAllActive(): Promise<Customer[]>;
}

// ==================================================================================
// SALES & COMMERCIAL
// ==================================================================================
export interface ISaleRepository extends IBaseRepository<Sale> {
  findByDateRange(startDate: string, endDate: string): Promise<Sale[]>;
  findByShiftId(shiftUuid: string): Promise<Sale[]>;
  
  /**
   * Retreives the complete object graph for a sale (Header, Lines, Payments, BillingInfo)
   */
  findFullSale(saleUuid: string): Promise<{ 
    sale: Sale; 
    lines: SaleLine[]; 
    payments: Payment[]; 
    billingInfo: SaleBillingInfo | null;
  } | null>;
  
  /**
   * Marks a sale as "Issued" (Facturada), locks it, and generates the VeriFactu chain record.
   */
  finalizeSale(saleUuid: string): Promise<void>;
}

export interface ISaleLineRepository extends IBaseRepository<SaleLine> {
  findBySaleId(saleUuid: string): Promise<SaleLine[]>;
  deleteBySaleId(saleUuid: string): Promise<void>;
  
  // Enterprise status updates
  voidLine(lineId: number, managerId: number, reason: string): Promise<void>;
}

export interface IPaymentRepository extends IBaseRepository<Payment> {
  findBySaleId(saleUuid: string): Promise<Payment[]>;
}

export interface IManagerOverrideRepository extends IBaseRepository<ManagerOverride> {
  findBySaleUuid(saleUuid: string): Promise<ManagerOverride[]>;
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
  getChainHead(deviceSerial: string): Promise<FiscalChainRecord | null>;
  
  /**
   * Checks if there are any gaps in 'chain_sequence_id'.
   */
  validateChainIntegrity(deviceSerial: string): Promise<boolean>;
}