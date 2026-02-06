export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'cashier' | 'manager'
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku: string
  category: string
  stock: number
  image?: string
  barcode?: string
}

export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
}

export interface Transaction {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod?: 'cash' | 'card' | 'mobile'
  status: 'pending' | 'completed' | 'cancelled' | 'suspended'
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  customerId?: string
  cashierId: string
}

export interface Settings {
  business: {
    name: string
    address: string
    phone: string
    email: string
    taxId: string
    logo?: string
  }
  currency: {
    code: string
    symbol: string
  }
  tax: {
    enabled: boolean
    rate: number
    inclusive: boolean
  }
  receipt: {
    header: string
    footer: string
    showLogo: boolean
  }
  theme: {
    name: string
    primaryColor: string
    logo?: string
  }
}
