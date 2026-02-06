import { TopBar } from '@/components/layout/top-bar'
import { ProductGrid } from '@/components/pos/product-grid'
import { ShoppingCart } from '@/components/pos/shopping-cart'
import { TransactionTabs } from '@/components/pos/transaction-tabs'
import { Button } from '@/components/ui/button'
import { useTransactionStore } from '@/store/transaction-store'
import { Plus } from 'lucide-react'
import React from 'react'

export const PosScreen: React.FC = () => {
  const { createTransaction, currentTransactionId } = useTransactionStore()

  React.useEffect(() => {
    // Create initial transaction if none exists
    if (!currentTransactionId) {
      createTransaction()
    }
  }, [currentTransactionId, createTransaction])

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
            <ProductGrid />
          </div>

          {/* Cart Section */}
          <div className="w-96 border-l bg-card">
            <ShoppingCart />
          </div>
        </div>
      </div>
    </div>
  )
}
