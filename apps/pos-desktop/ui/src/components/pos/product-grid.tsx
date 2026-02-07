import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useTransactionStore } from '@/store/transaction-store'
import { Product } from '@/types'
import { Search } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

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

interface ProductGridProps {
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export const ProductGrid: React.FC<ProductGridProps> = ({ searchInputRef }) => {
  const [search, setSearch] = useState('')
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const { addItem } = useTransactionStore()
  const localSearchRef = useRef<HTMLInputElement>(null)
  const productRefs = useRef<(HTMLDivElement | null)[]>([])

  // Use provided ref or local ref
  const inputRef = searchInputRef || localSearchRef

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())
  )

  // Keyboard navigation for products
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in search
      const target = e.target as HTMLElement
      const isInSearch = target === inputRef.current

      if (!isInSearch && filteredProducts.length > 0) {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          setSelectedProductIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1))
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setSelectedProductIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          const cols = 4 // Grid columns
          setSelectedProductIndex((prev) => Math.min(prev + cols, filteredProducts.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          const cols = 4
          setSelectedProductIndex((prev) => Math.max(prev - cols, 0))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          addItem(filteredProducts[selectedProductIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredProducts, selectedProductIndex, addItem, inputRef])

  // Keep selected index in bounds when filtering
  useEffect(() => {
    if (selectedProductIndex >= filteredProducts.length) {
      setSelectedProductIndex(Math.max(0, filteredProducts.length - 1))
    }
  }, [filteredProducts.length, selectedProductIndex])

  // Scroll selected product into view
  useEffect(() => {
    if (productRefs.current[selectedProductIndex]) {
      productRefs.current[selectedProductIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [selectedProductIndex])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search products by name, SKU, or category... (F1 or /)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product, index) => (
          <Card
            key={product.id}
            ref={(el) => (productRefs.current[index] = el)}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              index === selectedProductIndex ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
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

      <p className="text-xs text-center text-muted-foreground">
        Use arrow keys to navigate, Enter to add to cart
      </p>
    </div>
  )
}
