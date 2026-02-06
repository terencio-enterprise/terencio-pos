import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useTransactionStore } from '@/store/transaction-store'
import { Product } from '@/types'
import { Search } from 'lucide-react'
import React, { useState } from 'react'

// Mock products for demonstration
const mockProducts: Product[] = [
  { id: '1', name: 'Premium Coffee', price: 499, sku: 'COF-001', category: 'Beverages', stock: 50, barcode: '123456789' },
  { id: '2', name: 'Chocolate Bar', price: 249, sku: 'CHO-001', category: 'Snacks', stock: 100 },
  { id: '3', name: 'Orange Juice', price: 349, sku: 'BEV-002', category: 'Beverages', stock: 30 },
  { id: '4', name: 'Sandwich', price: 699, sku: 'FOD-001', category: 'Food', stock: 20 },
  { id: '5', name: 'Water Bottle', price: 149, sku: 'BEV-003', category: 'Beverages', stock: 80 },
  { id: '6', name: 'Energy Drink', price: 299, sku: 'BEV-004', category: 'Beverages', stock: 45 },
  { id: '7', name: 'Chips', price: 199, sku: 'SNK-002', category: 'Snacks', stock: 60 },
  { id: '8', name: 'Cookies', price: 279, sku: 'SNK-003', category: 'Snacks', stock: 55 },
]

export const ProductGrid: React.FC = () => {
  const [search, setSearch] = useState('')
  const { addItem } = useTransactionStore()

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            onClick={() => addItem(product)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {product.category}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatCurrency(product.price / 100)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Stock: {product.stock}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No products found
        </div>
      )}
    </div>
  )
}
