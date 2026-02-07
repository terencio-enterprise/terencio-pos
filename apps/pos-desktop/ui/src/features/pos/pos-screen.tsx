import { TopBar } from '@/components/layout/top-bar'
import { ProductGrid } from '@/components/pos/product-grid'
import { ShoppingCart } from '@/components/pos/shopping-cart'
import { TransactionTabs } from '@/components/pos/transaction-tabs'
import { Button } from '@/components/ui/button'
import { ShiftDialog } from '@/features/shift/shift-dialog'
import { useGlobalKeyboard } from '@/lib/use-keyboard'
import { useShiftStore } from '@/store/shift-store'
import { useTransactionStore } from '@/store/transaction-store'
import { Plus } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const PosScreen: React.FC = () => {
  const { createTransaction, currentTransactionId, clearCart, getCurrentTransaction } = useTransactionStore()
  const { currentShift, loadCurrentShift } = useShiftStore()
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Load current shift on mount
    loadCurrentShift()
  }, [loadCurrentShift])

  useEffect(() => {
    // Show shift dialog if no active shift
    if (currentShift === null) {
      // Still loading
      return
    }
    
    if (currentShift.status !== 'OPEN') {
      setShowShiftDialog(true)
    }
  }, [currentShift])

  useEffect(() => {
    // Create initial transaction if none exists
    if (!currentTransactionId) {
      createTransaction()
    }
  }, [currentTransactionId, createTransaction])

  const handleShiftDialogClose = () => {
    // Don't allow closing without starting shift
    // User must start a shift to proceed
    if (currentShift?.status === 'OPEN') {
      setShowShiftDialog(false)
    }
  }

  const handleCheckout = () => {
    const transaction = getCurrentTransaction()
    if (transaction && transaction.items.length > 0) {
      // TODO: Open checkout dialog
      console.log('Open checkout')
    }
  }

  // Global keyboard shortcuts
  useGlobalKeyboard({
    SEARCH_FOCUS: () => {
      searchInputRef.current?.focus()
    },
    NEW_TRANSACTION: () => {
      createTransaction()
    },
    CLEAR_CART: () => {
      clearCart()
    },
    SETTINGS: () => {
      navigate('/settings')
    },
    CHECKOUT: handleCheckout,
  })

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Transaction Tabs */}
        <div className="border-b bg-card px-4 py-2">
          <div className="flex items-center gap-2">
            <TransactionTabs />
            <Button
              variant="outline"
              size="sm"
              onClick={createTransaction}
              className="ml-auto"
              title="New Transaction (F2)"
            >
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Products Section */}
          <div className="flex-1 overflow-auto p-6">
            <ProductGrid searchInputRef={searchInputRef} />
          </div>

          {/* Cart Section */}
          <div className="w-96 border-l bg-card">
            <ShoppingCart />
          </div>
        </div>
      </div>

      {/* Shift Dialog - Required before using POS */}
      <ShiftDialog
        isOpen={showShiftDialog}
        onClose={handleShiftDialogClose}
      />
    </div>
  )
}
