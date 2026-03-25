import { Fragment, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import type { Category, Product, Page } from '../types'

interface RestockSuggestion {
  productId: number
  productName: string
  categoryName: string | null
  currentStock: number
  minStock: number
  suggestedQuantity: number
}

interface RestockOrder {
  id: number
  createdAt: string
  notes: string | null
  items: RestockOrderItem[]
}

interface RestockOrderItem {
  id: number
  productId: number
  productName: string
  categoryName: string | null
  currentStock: number
  suggestedQuantity: number
  orderedQuantity: number
}

interface OrderItemForm {
  productId: number
  productName: string
  categoryName: string | null
  currentStock: number
  minStock: number
  suggestedQuantity: number
  orderedQuantity: string
  selected: boolean
}

export default function Reposicao() {
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([])
  const [orders, setOrders] = useState<RestockOrder[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [showProductSearch, setShowProductSearch] = useState(false)

  useEffect(() => {
    loadOrders()
    loadCategories()
    loadAllProducts()
  }, [])

  function loadCategories() {
    api.get<Category[]>('/categories')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
  }

  async function loadAllProducts() {
    setLoadingProducts(true)

    try {
      const pageSize = 50
      let currentPage = 0
      let totalPages = 1
      const allProducts: Product[] = []

      while (currentPage < totalPages) {
        const res = await api.get<Page<Product>>(
          `/products?page=${currentPage}&size=${pageSize}&sort=name,asc`
        )

        allProducts.push(...res.data.content)
        totalPages = res.data.totalPages
        currentPage++
      }

      allProducts.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
      setProducts(allProducts)
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  function loadSuggestions() {
    setLoading(true)

    const url = categoryFilter
      ? `/restock/suggestions?categoryId=${categoryFilter}`
      : '/restock/suggestions'

    api.get<RestockSuggestion[]>(url)
      .then(res => {
        const newItems = res.data.map(s => ({
          productId: s.productId,
          productName: s.productName,
          categoryName: s.categoryName,
          currentStock: s.currentStock,
          minStock: s.minStock,
          suggestedQuantity: s.suggestedQuantity,
          orderedQuantity: String(Math.max(1, s.suggestedQuantity)),
          selected: true
        }))

        setOrderItems(prev => {
          const existingIds = prev.map(item => item.productId)
          return [...prev, ...newItems.filter(item => !existingIds.includes(item.productId))]
        })
      })
      .finally(() => setLoading(false))
  }

  function addProductManually(product: Product) {
    if (orderItems.some(item => item.productId === product.id)) {
      setProductSearch('')
      setShowProductSearch(false)
      return
    }

    const suggested = Math.max(0, product.minStock - product.stock)

    setOrderItems(prev => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        categoryName: product.categoryName,
        currentStock: product.stock,
        minStock: product.minStock,
        suggestedQuantity: suggested,
        orderedQuantity: String(Math.max(1, suggested)),
        selected: true
      }
    ])

    setProductSearch('')
    setShowProductSearch(false)
  }

  function removeItem(productId: number) {
    setOrderItems(prev => prev.filter(item => item.productId !== productId))
  }

  function toggleSelect(productId: number) {
    setOrderItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, selected: !item.selected }
          : item
      )
    )
  }

  function updateQuantity(productId: number, value: string) {
    if (!/^\d*$/.test(value)) return

    setOrderItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, orderedQuantity: value }
          : item
      )
    )
  }

  function normalizeQuantity(productId: number) {
    setOrderItems(prev =>
      prev.map(item => {
        if (item.productId !== productId) return item

        const parsed = Number(item.orderedQuantity)
        return {
          ...item,
          orderedQuantity: !item.orderedQuantity || parsed < 1 ? '1' : String(parsed)
        }
      })
    )
  }

  function loadOrders() {
    setLoadingOrders(true)

    api.get<RestockOrder[]>('/restock/orders')
      .then(res => {
        setOrders(
          res.data.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
      })
      .finally(() => setLoadingOrders(false))
  }

  async function handleConfirm() {
    const selectedItems = orderItems.filter(item => item.selected)

    if (selectedItems.length === 0) {
      alert('Selecione ao menos um item!')
      return
    }

    if (submitting) return
    setSubmitting(true)

    const body = {
      notes: notes || null,
      items: selectedItems.map(item => ({
        productId: item.productId,
        suggestedQuantity: item.suggestedQuantity,
        orderedQuantity: Number(item.orderedQuantity)
      }))
    }

    try {
      const res = await api.post<RestockOrder>('/restock/orders', body)
      setOrderItems([])
      setNotes('')
      loadOrders()
      downloadPdf(res.data.id)
    } finally {
      setSubmitting(false)
    }
  }

  function downloadPdf(orderId: number) {
    api.get(`/restock/orders/${orderId}/pdf`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `pedido-reposicao-${orderId}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
      })
  }

  const selectedCount = orderItems.filter(item => item.selected).length

  const selectedCategoryName = categoryFilter
    ? categories.find(c => String(c.id) === categoryFilter)?.name
    : null

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = product.name
          .toLowerCase()
          .includes(productSearch.toLowerCase())

        const matchesCategory = !categoryFilter
          || product.categoryName === selectedCategoryName

        const notAddedYet = !orderItems.some(item => item.productId === product.id)

        return matchesSearch && matchesCategory && notAddedYet
      })
      .slice(0, 20)
  }, [products, productSearch, categoryFilter, selectedCategoryName, orderItems])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white text-lg font-medium">Reposição de Estoque</h1>
        <p className="text-white/30 text-sm mt-0.5">Crie pedidos de reposição e gere PDF</p>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-white/60 text-sm font-medium">Montar pedido</h2>

        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex flex-col gap-1">
            <label className="text-white/30 text-xs">Filtrar sugestões por categoria</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-[#0a0c14] border border-white/10 text-white/60 text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb]"
            >
              <option value="">Todas as categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadSuggestions}
            disabled={loading}
            className="border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Buscando...' : '+ Sugestões automáticas'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProductSearch(v => !v)}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              + Adicionar produto
            </button>

            {showProductSearch && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-[#13151f] border border-white/10 rounded-lg z-20 shadow-lg">
                <div className="p-2">
                  <input
                    autoFocus
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-xs outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {loadingProducts ? (
                    <p className="text-white/30 text-xs px-3 py-2">Carregando produtos...</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-white/30 text-xs px-3 py-2">
                      Nenhum produto encontrado
                    </p>
                  ) : (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProductManually(product)}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <p className="text-white/80 text-xs">{product.name}</p>
                        <p className="text-white/30 text-xs">
                          {product.categoryName ?? 'Sem categoria'} · Estoque: {product.stock} · Mínimo: {product.minStock}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {orderItems.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="w-10 px-3 py-2 text-left text-white/30 font-normal"></th>
                    <th className="px-3 py-2 text-left text-white/30 font-normal">Produto</th>
                    <th className="px-3 py-2 text-left text-white/30 font-normal hidden md:table-cell">Categoria</th>
                    <th className="w-20 px-3 py-2 text-center text-white/30 font-normal">Atual</th>
                    <th className="w-20 px-3 py-2 text-center text-white/30 font-normal">Mínimo</th>
                    <th className="w-24 px-3 py-2 text-center text-white/30 font-normal">Sugerido</th>
                    <th className="w-24 px-3 py-2 text-center text-white/30 font-normal">Pedir</th>
                    <th className="w-10 px-3 py-2 text-right text-white/30 font-normal"></th>
                  </tr>
                </thead>

                <tbody>
                  {orderItems.map(item => (
                    <tr
                      key={item.productId}
                      className={`border-b border-white/5 ${item.selected ? '' : 'opacity-40'}`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleSelect(item.productId)}
                          className="w-4 h-4 accent-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2 text-white/80 whitespace-nowrap">
                        {item.productName}
                      </td>

                      <td className="px-3 py-2 text-white/40 hidden md:table-cell whitespace-nowrap">
                        {item.categoryName ?? '—'}
                      </td>

                      <td
                        className={`px-3 py-2 text-center font-medium ${
                          item.currentStock < item.minStock ? 'text-red-400' : 'text-white/60'
                        }`}
                      >
                        {item.currentStock}
                      </td>

                      <td className="px-3 py-2 text-center text-white/40">
                        {item.minStock}
                      </td>

                      <td className="px-3 py-2 text-center text-white/40">
                        {item.suggestedQuantity}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.orderedQuantity}
                          onChange={e => updateQuantity(item.productId, e.target.value)}
                          onBlur={() => normalizeQuantity(item.productId)}
                          disabled={!item.selected}
                          className="w-16 bg-[#0a0c14] border border-white/10 rounded px-2 py-1 text-white text-xs text-center outline-none focus:border-[#2563eb] disabled:opacity-30"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-white/20 hover:text-red-400 transition-colors text-base leading-none"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3 pt-2 border-t border-white/5">
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observações (opcional)"
                className="w-full md:flex-1 bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full md:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {submitting ? 'Gerando...' : `Gerar pedido (${selectedCount}) + PDF`}
              </button>
            </div>
          </>
        ) : (
          <p className="text-white/20 text-sm text-center py-4">
            Adicione produtos manualmente ou clique em "Sugestões automáticas"
          </p>
        )}
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white/60 text-sm font-medium">Histórico de pedidos</h2>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center h-24 text-white/30 text-sm">
            Carregando...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-white/30 text-sm">
            Nenhum pedido gerado ainda
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="w-10 px-4 py-3 text-left text-white/30 font-normal"></th>
                  <th className="w-40 px-4 py-3 text-left text-white/30 font-normal">Data</th>
                  <th className="px-4 py-3 text-left text-white/30 font-normal hidden md:table-cell">
                    Observações
                  </th>
                  <th className="w-28 px-4 py-3 text-center text-white/30 font-normal">Itens</th>
                  <th className="w-24 px-4 py-3 text-right text-white/30 font-normal">PDF</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(order => (
                  <Fragment key={order.id}>
                    <tr
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <td className="px-4 py-3 text-white/30 text-xs align-middle">
                        {expandedOrder === order.id ? '▾' : '▸'}
                      </td>

                      <td className="px-4 py-3 text-white/70 whitespace-nowrap align-middle">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="px-4 py-3 text-white/40 hidden md:table-cell align-middle">
                        <div className="truncate max-w-[420px]">
                          {order.notes ?? '—'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center text-white/50 whitespace-nowrap align-middle">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                      </td>

                      <td
                        className="px-4 py-3 text-right whitespace-nowrap align-middle"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => downloadPdf(order.id)}
                          className="text-[#4e90d9] hover:text-white text-xs transition-colors"
                        >
                          ↓ PDF
                        </button>
                      </td>
                    </tr>

                    {expandedOrder === order.id && (
                      <tr className="border-b border-white/5 bg-white/[0.03]">
                        <td colSpan={5} className="px-8 py-3">
                          <div className="flex flex-col gap-1">
                            <p className="text-white/20 text-xs mb-1">Itens do pedido</p>

                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-white/5 last:border-0 gap-2 md:gap-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-white/70 text-xs break-words">
                                    {item.productName}
                                  </span>

                                  {item.categoryName && (
                                    <span className="text-white/30 text-xs whitespace-nowrap">
                                      {item.categoryName}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                  <span className="text-white/30">
                                    Estoque: <span className="text-red-400">{item.currentStock}</span>
                                  </span>
                                  <span className="text-white/30">
                                    Sugerido: <span className="text-white/50">{item.suggestedQuantity}</span>
                                  </span>
                                  <span className="text-white/30">
                                    Pedido:{' '}
                                    <span className="text-white/70 font-medium">
                                      {item.orderedQuantity}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}