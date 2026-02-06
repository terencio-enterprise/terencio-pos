import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { useTransactionStore } from '@/store/transaction-store'
import { CreditCard, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import React from 'react'

export const ShoppingCart: React.FC = () => {
  const {
    getCurrentTransaction,
    removeItem,
    updateQuantity,
    clearCart,
    completeTransaction,
  } = useTransactionStore()

  const transaction = getCurrentTransaction()

  if (!transaction) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">No active transaction</p>
      </div>
    )
  }

  const handleCheckout = () => {
    completeTransaction('cash')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Current Sale</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          disabled={transaction.items.length === 0}
        >
          Clear
        </Button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto p-4">
        {transaction.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Cart is empty
            </p>
            <p className="text-xs text-muted-foreground">
              Click on products to add them
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div
                key={item.product.id}
                className="rounded-lg border bg-background p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.product.price / 100)} each
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.product.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        updateQuantity(item.product.id, Math.max(1, val))
                      }}
                      className="h-8 w-16 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(item.subtotal / 100)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t bg-muted/50 p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(transaction.subtotal / 100)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span>{formatCurrency(transaction.tax / 100)}</span>
          </div>
          {transaction.discount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Discount</span>
              <span>-{formatCurrency(transaction.discount / 100)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(transaction.total / 100)}</span>
          </div>
        </div>

        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={handleCheckout}
          disabled={transaction.items.length === 0}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Checkout
        </Button>
      </div>
    </div>
  )
}
