import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { useTransactionStore } from '@/store/transaction-store'
import { X } from 'lucide-react'
import React from 'react'

export const TransactionTabs: React.FC = () => {
  const { transactions, currentTransactionId, setCurrentTransaction, closeTransaction } = useTransactionStore()

  if (transactions.length === 0) {
    return null
  }

  return (
    <Tabs
      value={currentTransactionId || transactions[0]?.id}
      onValueChange={setCurrentTransaction}
      className="flex-1"
    >
      <TabsList className="h-auto justify-start">
        {transactions.map((transaction, index) => (
          <TabsTrigger
            key={transaction.id}
            value={transaction.id}
            className="group relative pr-8"
          >
            <div className="flex items-center gap-2">
              <span>Sale #{index + 1}</span>
              {transaction.items.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {transaction.items.length}
                </Badge>
              )}
              {transaction.total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(transaction.total)}
                </span>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                closeTransaction(transaction.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
