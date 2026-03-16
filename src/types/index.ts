export interface LoginRequest {
  login: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface Category {
  id: number
  name: string
  description: string | null
}

export interface Product {
  id: number
  name: string
  description: string | null
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  active: boolean
  categoryName: string | null
}

export interface SaleItem {
  id: number
  itemType: 'PRODUCT' | 'SERVICE'
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  categoryName?: string | null
  serviceCost?: number | null
}

export interface Sale {
  id: number
  customerName: string
  saleDate: string
  subtotal: number
  discountValue: number | null
  discountPercentual: number | null
  totalAmount: number
  notes: string | null
  items: SaleItem[]
}

export interface Expense {
  id: number
  description: string
  value: number
  date: string
  categoryId: number
  categoryName: string
  notes: string | null
}

export interface ExpenseCategory {
  id: number
  name: string
  description: string | null
}

export interface ReportResponse {
  totalRevenue: number
  totalExpenses: number
  estimatedProfit: number
  averageMargin: number
  bestSellingProducts: ProductRankingItem[]
  mostProfitableProducts: ProductRankingItem[]
  productsBelowMinStock: LowStockItem[]
}

export interface ProductRankingItem {
  productId: number
  productName: string
  totalQuantitySold: number
  totalRevenue: number
  totalProfit: number
}

export interface LowStockItem {
  productId: number
  productName: string
  currentStock: number
  minimumStock: number
}

export interface RestockSuggestion {
  productId: number
  productName: string
  categoryName: string | null
  currentStock: number
  minStock: number
  suggestedQuantity: number
}

export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}