import { useState, useEffect } from 'react'
import api from '../api/axios'
import type { Sale, Product, Category, Page } from '../types'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

interface SaleItemForm {
  itemType: 'PRODUCT' | 'SERVICE'
  productId: string
  categoryId: string
  categorySearch: string
  description: string
  quantity: string
  unitPrice: string
  serviceCost: string
}

function Vendas() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedSale, setExpandedSale] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    customerName: '',
    notes: '',
    discountValue: '',
    discountPercentual: '',
  })

  const [items, setItems] = useState<SaleItemForm[]>([
    {
      itemType: 'PRODUCT',
      productId: '',
      categoryId: '',
      categorySearch: '',
      description: '',
      quantity: '1',
      unitPrice: '',
      serviceCost: ''
    }
  ])

  function loadSales() {
    setLoading(true)
    api.get<Page<Sale>>('/sales?size=50&sort=saleDate,desc')
      .then(res => {
        setSales(res.data.content)
        setTotalPages(res.data.totalPages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSales()
  }, [page])

  useEffect(() => {
    api.get('/products?size=1000')
      .then(res => {
        const data = res.data
        if (data.content) setProducts(data.content)
        else if (Array.isArray(data)) setProducts(data)
        else setProducts([])
      })
      .catch(() => setProducts([]))

    api.get<Category[]>('/categories')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
  }, [])

  function addItem() {
    setItems(prev => [
      ...prev,
      {
        itemType: 'PRODUCT',
        productId: '',
        categoryId: '',
        categorySearch: '',
        description: '',
        quantity: '1',
        unitPrice: '',
        serviceCost: ''
      }
    ])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof SaleItemForm, value: string) {
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item
        return { ...item, [field]: value }
      })
    )
  }

  function selectProduct(index: number, product: Product) {
    setItems(prev =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: String(product.id),
              description: product.name,
              unitPrice: String(product.salePrice)
            }
          : item
      )
    )
  }

  function selectCategory(index: number, category: Category) {
    setItems(prev =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              categoryId: String(category.id),
              categorySearch: category.name
            }
          : item
      )
    )
  }

  const subtotal = items.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
  }, 0)

  const discount = form.discountValue
    ? Number(form.discountValue)
    : form.discountPercentual
      ? subtotal * (Number(form.discountPercentual) / 100)
      : 0

  const total = subtotal - discount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const body = {
      customerName: form.customerName,
      notes: form.notes || null,
      discountValue: form.discountValue ? Number(form.discountValue) : null,
      discountPercentual: form.discountPercentual ? Number(form.discountPercentual) : null,
      items: items.map(item => ({
        itemType: item.itemType,
        productId: item.itemType === 'PRODUCT' && item.productId ? Number(item.productId) : null,
        categoryId: item.itemType === 'SERVICE' && item.categoryId ? Number(item.categoryId) : null,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        serviceCost: item.itemType === 'SERVICE' && item.serviceCost ? Number(item.serviceCost) : null,
      }))
    }

    await api.post('/sales', body)

    setShowModal(false)
    setForm({
      customerName: '',
      notes: '',
      discountValue: '',
      discountPercentual: '',
    })
    setItems([
      {
        itemType: 'PRODUCT',
        productId: '',
        categoryId: '',
        categorySearch: '',
        description: '',
        quantity: '1',
        unitPrice: '',
        serviceCost: ''
      }
    ])
    loadSales()
  }

  async function handleDelete(id: number) {
    if (!confirm('Deletar venda? O estoque será restaurado.')) return
    await api.delete(`/sales/${id}`)
    loadSales()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-lg font-medium">Vendas</h1>
          <p className="text-white/30 text-sm mt-0.5">Histórico e registro de vendas</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          + Nova venda
        </button>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Carregando...
          </div>
        ) : sales.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Nenhuma venda encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-2 md:px-4 py-3 text-white/30 font-normal w-6"></th>
                  <th className="text-left px-2 md:px-4 py-3 text-white/30 font-normal min-w-[140px]">Cliente</th>
                  <th className="text-left px-2 md:px-4 py-3 text-white/30 font-normal hidden md:table-cell">Data</th>
                  <th className="text-right px-2 md:px-4 py-3 text-white/30 font-normal hidden md:table-cell">Subtotal</th>
                  <th className="text-right px-2 md:px-4 py-3 text-white/30 font-normal hidden md:table-cell">Desconto</th>
                  <th className="text-right px-2 md:px-4 py-3 text-white/30 font-normal">Total</th>
                  <th className="text-right px-2 md:px-4 py-3 text-white/30 font-normal">Ações</th>
                </tr>
              </thead>

              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td colSpan={7} className="p-0">
                      <>
                        <div
                          className="grid grid-cols-[24px_minmax(140px,1fr)_120px_120px_120px_120px_90px] items-center border-b border-white/5 hover:bg-white/2 cursor-pointer"
                          onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                        >
                          <div className="px-2 md:px-4 py-3 text-white/30 text-xs">
                            {expandedSale === sale.id ? '▾' : '▸'}
                          </div>

                          <div className="px-2 md:px-4 py-3 text-white/80 whitespace-nowrap">
                            {sale.customerName}
                          </div>

                          <div className="px-2 md:px-4 py-3 text-white/40 hidden md:block whitespace-nowrap">
                            {formatDate(sale.saleDate)}
                          </div>

                          <div className="px-2 md:px-4 py-3 text-right text-white/40 hidden md:block whitespace-nowrap">
                            {formatCurrency(sale.subtotal)}
                          </div>

                          <div className="px-2 md:px-4 py-3 text-right text-white/40 hidden md:block whitespace-nowrap">
                            {sale.discountValue
                              ? formatCurrency(sale.discountValue)
                              : sale.discountPercentual
                                ? `${sale.discountPercentual}%`
                                : '—'}
                          </div>

                          <div className="px-2 md:px-4 py-3 text-right text-green-400 font-medium whitespace-nowrap">
                            {formatCurrency(sale.totalAmount)}
                          </div>

                          <div
                            className="px-2 md:px-4 py-3 text-right whitespace-nowrap"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="text-white/30 hover:text-red-400 text-xs transition-colors"
                            >
                              Deletar
                            </button>
                          </div>
                        </div>

                        {expandedSale === sale.id && (
                          <div className="border-b border-white/5 bg-white/2 px-4 md:px-8 py-3">
                            <div className="flex flex-col gap-1">
                              <p className="text-white/20 text-xs mb-1">Itens da venda</p>

                              {sale.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 gap-4"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
                                        item.itemType === 'PRODUCT'
                                          ? 'bg-blue-900/40 text-blue-400'
                                          : 'bg-purple-900/40 text-purple-400'
                                      }`}
                                    >
                                      {item.itemType === 'PRODUCT' ? 'Produto' : 'Serviço'}
                                    </span>

                                    <span className="text-white/70 text-xs whitespace-nowrap">{item.description}</span>
                                    <span className="text-white/30 text-xs whitespace-nowrap">× {item.quantity}</span>
                                  </div>

                                  <div className="flex items-center gap-3 whitespace-nowrap">
                                    {item.itemType === 'SERVICE' && item.serviceCost != null && (
                                      <span className="text-white/30 text-xs">
                                        custo: {formatCurrency(item.serviceCost)}
                                      </span>
                                    )}

                                    <span className="text-white/40 text-xs">
                                      {formatCurrency(item.unitPrice)}/un
                                    </span>

                                    <span className="text-white/70 text-xs font-medium">
                                      {formatCurrency(item.totalPrice)}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {sale.notes && (
                                <p className="text-white/30 text-xs mt-1 italic">
                                  Obs: {sale.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-3 py-1"
          >
            ← Anterior
          </button>

          <span className="text-white/30 text-sm">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-3 py-1"
          >
            Próximo →
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-3 md:p-4 overflow-y-auto">
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl w-full max-w-3xl p-4 md:p-6 my-4">
            <h2 className="text-white font-medium text-xl mb-4">Nova venda</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="Nome do cliente"
                required
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <div className="flex flex-col gap-2">
                <p className="text-white/40 text-xs">Itens</p>

                <div className="hidden md:grid md:grid-cols-12 gap-2 px-1">
                  <div className="col-span-2 text-white/20 text-xs">Tipo</div>
                  <div className="col-span-5 text-white/20 text-xs">Produto / Serviço</div>
                  <div className="col-span-1 text-white/20 text-xs text-center">Qtd</div>
                  <div className="col-span-2 text-white/20 text-xs">Custo</div>
                  <div className="col-span-1 text-white/20 text-xs">Preço</div>
                  <div className="col-span-1"></div>
                </div>

                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-white/10 rounded-xl p-3 md:p-0 md:border-0"
                  >
                    <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-2 md:items-start">
                      <div className="md:col-span-2">
                        <label className="md:hidden block text-white/30 text-xs mb-1">Tipo</label>
                        <select
                          value={item.itemType}
                          onChange={e => {
                            setItems(prev =>
                              prev.map((it, i) =>
                                i === index
                                  ? {
                                      ...it,
                                      itemType: e.target.value as 'PRODUCT' | 'SERVICE',
                                      productId: '',
                                      categoryId: '',
                                      categorySearch: '',
                                      description: '',
                                      unitPrice: '',
                                      serviceCost: ''
                                    }
                                  : it
                              )
                            )
                          }}
                          className="w-full bg-[#0a0c14] border border-white/10 rounded px-2 py-2 text-white/80 text-sm outline-none focus:border-[#2563eb]"
                        >
                          <option value="PRODUCT">Produto</option>
                          <option value="SERVICE">Serviço</option>
                        </select>
                      </div>

                      <div className="md:col-span-5 relative flex flex-col gap-2">
                        <label className="md:hidden block text-white/30 text-xs">Produto / Serviço</label>

                        {item.itemType === 'PRODUCT' ? (
                          <>
                            <input
                              value={item.description}
                              onChange={e => {
                                updateItem(index, 'description', e.target.value)
                                updateItem(index, 'productId', '')
                              }}
                              placeholder="Buscar produto..."
                              className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                            />

                            {item.description && !item.productId && (
                              <div className="absolute top-[74px] md:top-10 left-0 right-0 bg-[#13151f] border border-white/10 rounded-lg z-20 max-h-36 overflow-y-auto shadow-lg">
                                {products
                                  .filter(p =>
                                    p.name.toLowerCase().includes(item.description.toLowerCase())
                                  )
                                  .slice(0, 6)
                                  .map(p => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => selectProduct(index, p)}
                                      className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                    >
                                      <p className="text-white/80 text-xs">{p.name}</p>
                                      <p className="text-white/30 text-xs">
                                        {formatCurrency(p.salePrice)} · estoque: {p.stock}
                                      </p>
                                    </button>
                                  ))}

                                {products.filter(p =>
                                  p.name.toLowerCase().includes(item.description.toLowerCase())
                                ).length === 0 && (
                                  <p className="text-white/30 text-xs px-3 py-2">
                                    Nenhum produto encontrado
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <input
                                value={item.categorySearch}
                                onChange={e => {
                                  updateItem(index, 'categorySearch', e.target.value)
                                  updateItem(index, 'categoryId', '')
                                }}
                                placeholder="Categoria (opcional)"
                                className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                              />

                              {item.categorySearch && !item.categoryId && (
                                <div className="absolute top-full left-0 right-0 bg-[#13151f] border border-white/10 rounded-lg mt-0.5 z-20 max-h-32 overflow-y-auto shadow-lg">
                                  {categories
                                    .filter(c =>
                                      c.name.toLowerCase().includes(item.categorySearch.toLowerCase())
                                    )
                                    .slice(0, 5)
                                    .map(c => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => selectCategory(index, c)}
                                        className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                      >
                                        <p className="text-white/80 text-xs">{c.name}</p>
                                      </button>
                                    ))}

                                  {categories.filter(c =>
                                    c.name.toLowerCase().includes(item.categorySearch.toLowerCase())
                                  ).length === 0 && (
                                    <p className="text-white/30 text-xs px-3 py-2">
                                      Nenhuma categoria encontrada
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <input
                              value={item.description}
                              onChange={e => updateItem(index, 'description', e.target.value)}
                              placeholder="Ex: Mão de obra Gol G5"
                              required
                              className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                            />
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 md:contents">
                        <div className="md:col-span-1">
                          <label className="md:hidden block text-white/30 text-xs mb-1">Qtd</label>
                          <input
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                            type="number"
                            min="1"
                            required
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-2 py-2 text-white text-sm text-center outline-none focus:border-[#2563eb]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="md:hidden block text-white/30 text-xs mb-1">
                            {item.itemType === 'SERVICE' ? 'Custo' : 'Preço'}
                          </label>

                          {item.itemType === 'SERVICE' ? (
                            <input
                              value={item.serviceCost}
                              onChange={e => updateItem(index, 'serviceCost', e.target.value)}
                              type="number"
                              step="0.01"
                              placeholder="Custo"
                              className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                            />
                          ) : null}
                        </div>

                        <div className={item.itemType === 'SERVICE' ? 'md:col-span-1' : 'col-span-2 md:col-span-3'}>
                          <label className="md:hidden block text-white/30 text-xs mb-1">Preço</label>
                          <input
                            value={item.unitPrice}
                            onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                            type="number"
                            step="0.01"
                            placeholder="Preço"
                            required
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      </div>

                      {item.itemType === 'SERVICE' && (
                        <div className="hidden md:block md:col-span-2">
                          <input
                            value={item.serviceCost}
                            onChange={e => updateItem(index, 'serviceCost', e.target.value)}
                            type="number"
                            step="0.01"
                            placeholder="Custo"
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-2 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      )}

                      <div className={item.itemType === 'SERVICE' ? 'hidden md:block md:col-span-1' : 'hidden md:block md:col-span-3'}>
                        <input
                          value={item.unitPrice}
                          onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                          type="number"
                          step="0.01"
                          placeholder="Preço"
                          required
                          className="w-full bg-[#0a0c14] border border-white/10 rounded px-2 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                        />
                      </div>

                      <div className="flex justify-end md:justify-center md:pt-7">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-white/20 hover:text-red-400 transition-colors text-xl leading-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItem}
                  className="border border-dashed border-white/10 text-white/30 hover:text-white/50 hover:border-white/20 text-sm py-2 rounded-lg transition-colors"
                >
                  + Adicionar item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-xs">Desconto em R$</label>
                  <input
                    value={form.discountValue}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        discountValue: e.target.value,
                        discountPercentual: ''
                      }))
                    }
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-xs">Desconto em %</label>
                  <input
                    value={form.discountPercentual}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        discountPercentual: e.target.value,
                        discountValue: ''
                      }))
                    }
                    placeholder="0"
                    type="number"
                    step="0.1"
                    className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observações (opcional)"
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <div className="bg-[#0a0c14] rounded-lg p-3 flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Subtotal</span>
                  <span className="text-white/60">{formatCurrency(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Desconto</span>
                    <span className="text-red-400">- {formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-medium border-t border-white/5 pt-1 mt-1">
                  <span className="text-white/60">Total</span>
                  <span className="text-white">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-white/10 text-white/50 text-sm py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm py-2.5 rounded-lg transition-colors"
                >
                  Registrar venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vendas