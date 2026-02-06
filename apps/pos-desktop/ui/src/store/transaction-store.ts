import { generateId } from '@/lib/utils'
import { CartItem, Product, Transaction } from '@/types'
import { create } from 'zustand'

interface TransactionState {
  transactions: Transaction[]
  currentTransactionId: string | null
  
  // Transaction management
  createTransaction: () => void
  setCurrentTransaction: (id: string) => void
  closeTransaction: (id: string) => void
  suspendTransaction: (id: string) => void
  resumeTransaction: (id: string) => void
  
  // Cart operations for current transaction
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  
  // Payment
  completeTransaction: (paymentMethod: 'cash' | 'card' | 'mobile') => void
  
  // Getters
  getCurrentTransaction: () => Transaction | undefined
  getTransactionById: (id: string) => Transaction | undefined
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  currentTransactionId: null,

  createTransaction: () => {
    const newTransaction: Transaction = {
      id: generateId(),
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      cashierId: 'current-user', // TODO: Get from auth store
    }

    set((state) => ({
      transactions: [...state.transactions, newTransaction],
      currentTransactionId: newTransaction.id,
    }))
  },

  setCurrentTransaction: (id: string) => {
    set({ currentTransactionId: id })
  },

  closeTransaction: (id: string) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      currentTransactionId:
        state.currentTransactionId === id
          ? state.transactions.find((t) => t.id !== id)?.id || null
          : state.currentTransactionId,
    }))
  },

  suspendTransaction: (id: string) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, status: 'suspended' as const } : t
      ),
    }))
  },

  resumeTransaction: (id: string) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, status: 'pending' as const } : t
      ),
      currentTransactionId: id,
    }))
  },

  addItem: (product: Product, quantity = 1) => {
    const { currentTransactionId, transactions } = get()
    if (!currentTransactionId) return

    set({
      transactions: transactions.map((t) => {
        if (t.id !== currentTransactionId) return t

        const existingItem = t.items.find((i) => i.product.id === product.id)
        let newItems: CartItem[]

        if (existingItem) {
          newItems = t.items.map((i) =>
            i.product.id === product.id
              ? {
                  ...i,
                  quantity: i.quantity + quantity,
                  subtotal: (i.quantity + quantity) * product.price,
                }
              : i
          )
        } else {
          newItems = [
            ...t.items,
            {
              product,
              quantity,
              subtotal: quantity * product.price,
            },
          ]
        }

        const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0)
        const tax = subtotal * 0.1 // 10% tax - should come from settings
        const total = subtotal + tax - t.discount

        return {
          ...t,
          items: newItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date(),
        }
      }),
    })
  },

  removeItem: (productId: string) => {
    const { currentTransactionId, transactions } = get()
    if (!currentTransactionId) return

    set({
      transactions: transactions.map((t) => {
        if (t.id !== currentTransactionId) return t

        const newItems = t.items.filter((i) => i.product.id !== productId)
        const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0)
        const tax = subtotal * 0.1
        const total = subtotal + tax - t.discount

        return {
          ...t,
          items: newItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date(),
        }
      }),
    })
  },

  updateQuantity: (productId: string, quantity: number) => {
    const { currentTransactionId, transactions } = get()
    if (!currentTransactionId) return

    set({
      transactions: transactions.map((t) => {
        if (t.id !== currentTransactionId) return t

        const newItems = t.items.map((i) =>
          i.product.id === productId
            ? {
                ...i,
                quantity,
                subtotal: quantity * i.product.price,
              }
            : i
        )

        const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0)
        const tax = subtotal * 0.1
        const total = subtotal + tax - t.discount

        return {
          ...t,
          items: newItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date(),
        }
      }),
    })
  },

  clearCart: () => {
    const { currentTransactionId, transactions } = get()
    if (!currentTransactionId) return

    set({
      transactions: transactions.map((t) =>
        t.id === currentTransactionId
          ? {
              ...t,
              items: [],
              subtotal: 0,
              tax: 0,
              total: 0,
              updatedAt: new Date(),
            }
          : t
      ),
    })
  },

  completeTransaction: (paymentMethod: 'cash' | 'card' | 'mobile') => {
    const { currentTransactionId, transactions } = get()
    if (!currentTransactionId) return

    set({
      transactions: transactions.map((t) =>
        t.id === currentTransactionId
          ? {
              ...t,
              status: 'completed' as const,
              paymentMethod,
              completedAt: new Date(),
              updatedAt: new Date(),
            }
          : t
      ),
    })

    // Close completed transaction after a short delay
    setTimeout(() => {
      get().closeTransaction(currentTransactionId)
    }, 1000)
  },

  getCurrentTransaction: () => {
    const { currentTransactionId, transactions } = get()
    return transactions.find((t) => t.id === currentTransactionId)
  },

  getTransactionById: (id: string) => {
    return get().transactions.find((t) => t.id === id)
  },
}))
