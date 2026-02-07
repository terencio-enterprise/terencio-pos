import {
    AppSettings,
    Customer,
    FiscalRecord,
    Payment,
    Product,
    ProductPrice,
    Promotion,
    Sale,
    SaleLine,
    SaleTaxSummary,
    Shift,
    Tariff,
    Tax,
    User
} from './entities';

export interface IBaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: T): Promise<void>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}

// ==================================================================================
// SPECIFIC REPOSITORIES
// ==================================================================================

export interface IAppSettingsRepository {
  getAll(): Promise<AppSettings[]>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, description?: string): Promise<void>;
}

export interface IUserRepository extends IBaseRepository<User> {
  findByUsername(username: string): Promise<User | null>;
  findAllActive(): Promise<User[]>;
}

export interface IShiftRepository extends IBaseRepository<Shift> {
  findOpenShiftByUserId(userId: string): Promise<Shift | null>;
  findAllByUserId(userId: string): Promise<Shift[]>;
  startShift(userId: string, deviceId: string, startingCash: number): Promise<Shift>;
  endShift(shiftId: string, countedCash: number, notes?: string): Promise<Shift>;
  autoCloseShift(shiftId: string): Promise<Shift>;
}

export interface ITaxRepository extends IBaseRepository<Tax> {
  findAllActive(): Promise<Tax[]>;
  findDefault(): Promise<Tax | null>;
}

export interface ITariffRepository extends IBaseRepository<Tariff> {
  findAllActive(): Promise<Tariff[]>;
}

export interface ICustomerRepository extends IBaseRepository<Customer> {
  search(query: string): Promise<Customer[]>;
  findAllActive(): Promise<Customer[]>;
}

export interface IProductRepository extends IBaseRepository<Product> {
  findByBarcode(barcode: string): Promise<Product | null>;
  findByReference(reference: string): Promise<Product | null>;
  search(query: string): Promise<Product[]>;
  findAllActive(): Promise<Product[]>;
}

export interface IProductPriceRepository {
  findByProduct(productUuid: string): Promise<ProductPrice[]>;
  findByTariff(tariffUuid: string): Promise<ProductPrice[]>;
  getPrice(productUuid: string, tariffUuid: string): Promise<ProductPrice | null>;
  setPrice(price: ProductPrice): Promise<void>;
}

export interface IPromotionRepository extends IBaseRepository<Promotion> {
  findAllActive(): Promise<Promotion[]>;
}

export interface ISaleRepository extends IBaseRepository<Sale> {
  findByDateRange(startDate: string, endDate: string): Promise<Sale[]>;
  findByShiftId(shiftId: string): Promise<Sale[]>;
  findFullSale(saleId: string): Promise<{ 
    sale: Sale; 
    lines: SaleLine[]; 
    payments: Payment[]; 
    taxes: SaleTaxSummary[] 
  } | null>;
}

export interface ISaleLineRepository extends IBaseRepository<SaleLine> {
  findBySaleId(saleId: string): Promise<SaleLine[]>;
  deleteBySaleId(saleId: string): Promise<void>;
}

export interface ISaleTaxSummaryRepository {
  findBySaleId(saleId: string): Promise<SaleTaxSummary[]>;
  replaceForSale(saleId: string, summaries: SaleTaxSummary[]): Promise<void>;
}

export interface IPaymentRepository extends IBaseRepository<Payment> {
  findBySaleId(saleId: string): Promise<Payment[]>;
}

export interface IFiscalRecordRepository extends IBaseRepository<FiscalRecord> {
  findBySaleId(saleId: string): Promise<FiscalRecord[]>;
  getLastRecord(): Promise<FiscalRecord | null>;
}

export interface IDocumentSequenceRepository {
  getNextValue(series: string, deviceId: string): Promise<number>;
  getCurrentValue(series: string, deviceId: string): Promise<number>;
}
