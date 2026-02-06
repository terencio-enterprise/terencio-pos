// Type-safe Electron IPC wrapper
export const electronAPI = {
  // Database operations
  invoke: (channel: string, ...args: any[]) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return (window as any).electronAPI.invoke(channel, ...args)
    }
    return Promise.reject(new Error('Electron API not available'))
  },

  // Listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return (window as any).electronAPI.on(channel, callback)
    }
  },

  // Remove listeners
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return (window as any).electronAPI.removeListener(channel, callback)
    }
  },
}

// Specific API methods
export const db = {
  // User operations
  login: (email: string, password: string) =>
    electronAPI.invoke('db:user:login', email, password),
  
  // Product operations
  getProducts: () => electronAPI.invoke('db:products:getAll'),
  getProduct: (id: string) => electronAPI.invoke('db:products:get', id),
  
  // Transaction operations
  createTransaction: (transaction: any) =>
    electronAPI.invoke('db:transaction:create', transaction),
  updateTransaction: (id: string, transaction: any) =>
    electronAPI.invoke('db:transaction:update', id, transaction),
  getTransactions: () => electronAPI.invoke('db:transactions:getAll'),
  
  // Settings operations
  getSettings: () => electronAPI.invoke('db:settings:get'),
  updateSettings: (settings: any) =>
    electronAPI.invoke('db:settings:update', settings),
}
