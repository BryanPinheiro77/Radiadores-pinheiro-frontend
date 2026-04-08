import { useMemo, useState, useEffect } from 'react'
import api from '../api/axios'
import type { Sale, Product, Category, Page } from '../types'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function isServiceProduct(product: Product) {
  const name = normalizeText(product.name)
  const category = normalizeText(product.categoryName)

  return (
    category.includes('mao de obra') ||
    category.includes('servico') ||
    category.includes('service') ||
    name.includes('mao de obra') ||
    name.includes('servico') ||
    name.includes('service')
  )
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
  linkedServiceProductId?: string
}

function Vendas() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedSale, setExpandedSale] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
      serviceCost: '',
      linkedServiceProductId: ''
    }
  ])

  async function loadAllProducts() {
    setLoadingProducts(true)

    try {
      const pageSize = 50
      let currentPage = 0
      let totalPagesLocal = 1
      const all: Product[] = []

      while (currentPage < totalPagesLocal) {
        const res = await api.get<Page<Product>>(
          `/products?page=${currentPage}&size=${pageSize}&sort=name,asc`
        )

        all.push(...res.data.content)
        totalPagesLocal = res.data.totalPages
        currentPage++
      }

      const unique = Array.from(
        new Map(all.map(product => [product.id, product])).values()
      )

      unique.sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      )

      setProducts(unique)
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  function loadSales() {
    setLoading(true)
    api.get<Page<Sale>>(`/sales?page=${page}&size=20&sort=saleDate,desc`)
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
    loadAllProducts()

    api.get<Category[]>('/categories')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
  }, [])

  const serviceProducts = useMemo(
    () => products.filter(p => p.active && isServiceProduct(p)),
    [products]
  )

  const regularProducts = useMemo(
    () => products.filter(p => p.active && !isServiceProduct(p)),
    [products]
  )

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
        serviceCost: '',
        linkedServiceProductId: ''
      }
    ])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof SaleItemForm, value: string) {
    setItems(prev =>
      prev.map((item, i) => (i !== index ? item : { ...item, [field]: value }))
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
              unitPrice: String(product.salePrice),
              linkedServiceProductId: '',
              categoryId: '',
              categorySearch: ''
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

  function selectServiceProduct(index: number, product: Product) {
    const matchedCategory = categories.find(
      c => normalizeText(c.name) === normalizeText(product.categoryName)
    )

    setItems(prev =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              description: product.name,
              unitPrice: String(product.salePrice),
              serviceCost: String(product.costPrice ?? 0),
              categoryId: matchedCategory ? String(matchedCategory.id) : '',
              categorySearch: matchedCategory?.name ?? product.categoryName ?? '',
              linkedServiceProductId: String(product.id),
              productId: ''
            }
          : item
      )
    )
  }

  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  const discount = form.discountValue
    ? Number(form.discountValue)
    : form.discountPercentual
      ? subtotal * (Number(form.discountPercentual) / 100)
      : 0

  const total = subtotal - discount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)

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

    try {
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
          serviceCost: '',
          linkedServiceProductId: ''
        }
      ])
      loadSales()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Deletar venda? O estoque será restaurado.')) return
    await api.delete(`/sales/${id}`)
    loadSales()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Vendas</h1>
          <p className="text-white/30 text-sm mt-0.5">Histórico e registro de vendas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nova venda
        </button>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Carregando...</div>
        ) : sales.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Nenhuma venda encontrada</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-white/30 font-normal w-6"></th>
                    <th className="text-left px-4 py-3 text-white/30 font-normal">Cliente</th>
                    <th className="text-left px-4 py-3 text-white/30 font-normal">Data</th>
                    <th className="text-right px-4 py-3 text-white/30 font-normal">Subtotal</th>
                    <th className="text-right px-4 py-3 text-white/30 font-normal">Desconto</th>
                    <th className="text-right px-4 py-3 text-white/30 font-normal">Total</th>
                    <th className="text-right px-4 py-3 text-white/30 font-normal">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map(sale => (
                    <FragmentSaleRow
                      key={sale.id}
                      sale={sale}
                      expandedSale={expandedSale}
                      setExpandedSale={setExpandedSale}
                      handleDelete={handleDelete}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col divide-y divide-white/5">
              {sales.map(sale => (
                <div key={sale.id}>
                  <div
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-sm font-medium">{sale.customerName}</span>
                      <span className="text-green-400 text-sm font-medium">{formatCurrency(sale.totalAmount)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 text-xs">{formatDate(sale.saleDate)}</span>
                        {(sale.discountValue || sale.discountPercentual) && (
                          <span className="text-white/30 text-xs">
                            desc: {sale.discountValue ? formatCurrency(sale.discountValue) : `${sale.discountPercentual}%`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleDelete(sale.id)
                          }}
                          className="text-white/20 hover:text-red-400 text-xs transition-colors"
                        >
                          Deletar
                        </button>
                        <span className="text-white/30 text-xs">{expandedSale === sale.id ? '▾' : '▸'}</span>
                      </div>
                    </div>
                  </div>

                  {expandedSale === sale.id && (
                    <div className="px-4 pb-3 bg-white/2">
                      <p className="text-white/20 text-xs mb-2">Itens da venda</p>
                      <div className="flex flex-col gap-2">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-0.5 pb-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${item.itemType === 'PRODUCT' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'}`}>
                                {item.itemType === 'PRODUCT' ? 'Produto' : 'Serviço'}
                              </span>
                              <span className="text-white/70 text-xs">{item.description}</span>
                            </div>
                            <div className="flex items-center gap-3 pl-1">
                              <span className="text-white/30 text-xs">× {item.quantity}</span>
                              <span className="text-white/40 text-xs">{formatCurrency(item.unitPrice)}/un</span>
                              {item.serviceCost != null && (
                                <span className="text-white/30 text-xs">custo: {formatCurrency(item.serviceCost)}</span>
                              )}
                              <span className="text-white/70 text-xs font-medium ml-auto">{formatCurrency(item.totalPrice)}</span>
                            </div>
                          </div>
                        ))}
                        {sale.notes && <p className="text-white/30 text-xs italic">Obs: {sale.notes}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
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
          <span className="text-white/30 text-sm">{page + 1} / {totalPages}</span>
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
            <h2 className="text-white font-medium mb-4">Nova venda</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="Nome do cliente"
                required
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <div className="flex flex-col gap-2">
                <p className="text-white/40 text-xs">Itens</p>

                {items.map((item, index) => {
                  const productSuggestions = regularProducts
                    .filter(p => normalizeText(p.name).includes(normalizeText(item.description)))
                    .slice(0, 20)

                  const serviceSuggestions = serviceProducts
                    .filter(p => normalizeText(p.name).includes(normalizeText(item.description)))
                    .slice(0, 20)

                  const categorySuggestions = categories
                    .filter(c => normalizeText(c.name).includes(normalizeText(item.categorySearch)))
                    .slice(0, 10)

                  return (
                    <div key={index} className="border border-white/10 rounded-xl p-3 flex flex-col gap-3">
                      <div className="flex gap-2 flex-col md:flex-row">
                        <div className="flex flex-col gap-1 w-full md:w-32">
                          <label className="text-white/30 text-xs">Tipo</label>
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
                                        serviceCost: '',
                                        linkedServiceProductId: ''
                                      }
                                    : it
                                )
                              )
                            }}
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-2 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                          >
                            <option value="PRODUCT">Produto</option>
                            <option value="SERVICE">Serviço</option>
                          </select>
                        </div>

                        <div className="flex-1 flex flex-col gap-1 relative">
                          <label className="text-white/30 text-xs">
                            {item.itemType === 'PRODUCT' ? 'Produto' : 'Descrição do serviço'}
                          </label>

                          <input
                            value={item.description}
                            onChange={e => {
                              updateItem(index, 'description', e.target.value)

                              if (item.itemType === 'PRODUCT') {
                                updateItem(index, 'productId', '')
                              } else {
                                updateItem(index, 'linkedServiceProductId', '')
                              }
                            }}
                            placeholder={item.itemType === 'PRODUCT' ? 'Buscar produto...' : 'Digite ou busque um serviço cadastrado...'}
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                          />

                          {item.itemType === 'PRODUCT' && item.description && !item.productId && (
                            <div className="absolute top-[60px] left-0 right-0 bg-[#13151f] border border-white/10 rounded-lg z-20 max-h-44 overflow-y-auto shadow-lg">
                              {loadingProducts ? (
                                <p className="text-white/30 text-xs px-3 py-2">Carregando produtos...</p>
                              ) : productSuggestions.length === 0 ? (
                                <p className="text-white/30 text-xs px-3 py-2">Nenhum produto encontrado</p>
                              ) : (
                                productSuggestions.map(p => (
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
                                ))
                              )}
                            </div>
                          )}

                          {item.itemType === 'SERVICE' && item.description && !item.linkedServiceProductId && (
                            <div className="absolute top-[60px] left-0 right-0 bg-[#13151f] border border-white/10 rounded-lg z-20 max-h-44 overflow-y-auto shadow-lg">
                              {loadingProducts ? (
                                <p className="text-white/30 text-xs px-3 py-2">Carregando serviços...</p>
                              ) : serviceSuggestions.length === 0 ? (
                                <p className="text-white/30 text-xs px-3 py-2">
                                  Nenhum serviço cadastrado encontrado. Você pode continuar preenchendo manualmente.
                                </p>
                              ) : (
                                serviceSuggestions.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectServiceProduct(index, p)}
                                    className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                  >
                                    <p className="text-white/80 text-xs">{p.name}</p>
                                    <p className="text-white/30 text-xs">
                                      {p.categoryName ?? 'Sem categoria'} · venda: {formatCurrency(p.salePrice)}
                                    </p>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {item.itemType === 'SERVICE' && (
                        <div className="flex flex-col gap-1 relative">
                          <label className="text-white/30 text-xs">Categoria do serviço</label>
                          <input
                            value={item.categorySearch}
                            onChange={e => {
                              updateItem(index, 'categorySearch', e.target.value)
                              updateItem(index, 'categoryId', '')
                            }}
                            placeholder="Buscar categoria..."
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                          />

                          {item.categorySearch && !item.categoryId && (
                            <div className="absolute top-full left-0 right-0 bg-[#13151f] border border-white/10 rounded-lg mt-0.5 z-20 max-h-36 overflow-y-auto shadow-lg">
                              {categorySuggestions.length === 0 ? (
                                <p className="text-white/30 text-xs px-3 py-2">Nenhuma categoria encontrada</p>
                              ) : (
                                categorySuggestions.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => selectCategory(index, c)}
                                    className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                  >
                                    <p className="text-white/80 text-xs">{c.name}</p>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`grid gap-2 ${item.itemType === 'SERVICE' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                        <div className="flex flex-col gap-1">
                          <label className="text-white/30 text-xs">Qtd</label>
                          <input
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                            type="number"
                            min="1"
                            required
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm text-center outline-none focus:border-[#2563eb]"
                          />
                        </div>

                        {item.itemType === 'SERVICE' && (
                          <div className="flex flex-col gap-1">
                            <label className="text-white/30 text-xs">Custo (opc.)</label>
                            <input
                              value={item.serviceCost}
                              onChange={e => updateItem(index, 'serviceCost', e.target.value)}
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <label className="text-white/30 text-xs">Preço unit.</label>
                          <input
                            value={item.unitPrice}
                            onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            required
                            className="w-full bg-[#0a0c14] border border-white/10 rounded px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      </div>

                      {items.length > 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-white/20 hover:text-red-400 transition-colors text-xs"
                          >
                            Remover item
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={addItem}
                  className="border border-dashed border-white/10 text-white/30 hover:text-white/50 hover:border-white/20 text-sm py-2 rounded-lg transition-colors"
                >
                  + Adicionar item
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-xs">Desconto em R$</label>
                  <input
                    value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value, discountPercentual: '' }))}
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
                    onChange={e => setForm(f => ({ ...f, discountPercentual: e.target.value, discountValue: '' }))}
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => !submitting && setShowModal(false)}
                  className="flex-1 border border-white/10 text-white/50 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors"
                >
                  {submitting ? 'Registrando...' : 'Registrar venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FragmentSaleRow({
  sale,
  expandedSale,
  setExpandedSale,
  handleDelete,
  formatDate,
  formatCurrency
}: {
  sale: Sale
  expandedSale: number | null
  setExpandedSale: (id: number | null) => void
  handleDelete: (id: number) => void
  formatDate: (date: string) => string
  formatCurrency: (value: number) => string
}) {
  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/2 cursor-pointer"
        onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
      >
        <td className="px-4 py-3 text-white/30 text-xs">{expandedSale === sale.id ? '▾' : '▸'}</td>
        <td className="px-4 py-3 text-white/80">{sale.customerName}</td>
        <td className="px-4 py-3 text-white/40">{formatDate(sale.saleDate)}</td>
        <td className="px-4 py-3 text-right text-white/40">{formatCurrency(sale.subtotal)}</td>
        <td className="px-4 py-3 text-right text-white/40">
          {sale.discountValue
            ? formatCurrency(sale.discountValue)
            : sale.discountPercentual
              ? `${sale.discountPercentual}%`
              : '—'}
        </td>
        <td className="px-4 py-3 text-right text-green-400 font-medium">{formatCurrency(sale.totalAmount)}</td>
        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleDelete(sale.id)}
            className="text-white/30 hover:text-red-400 text-xs transition-colors"
          >
            Deletar
          </button>
        </td>
      </tr>

      {expandedSale === sale.id && (
        <tr className="border-b border-white/5 bg-white/2">
          <td colSpan={7} className="px-8 py-3">
            <div className="flex flex-col gap-1">
              <p className="text-white/20 text-xs mb-1">Itens da venda</p>
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${item.itemType === 'PRODUCT' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'}`}>
                      {item.itemType === 'PRODUCT' ? 'Produto' : 'Serviço'}
                    </span>
                    <span className="text-white/70 text-xs">{item.description}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs">× {item.quantity}</span>
                    <span className="text-white/40 text-xs">{formatCurrency(item.unitPrice)}/un</span>
                    {item.serviceCost != null && (
                      <span className="text-white/30 text-xs">custo: {formatCurrency(item.serviceCost)}</span>
                    )}
                    <span className="text-white/70 text-xs font-medium">{formatCurrency(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
              {sale.notes && <p className="text-white/30 text-xs mt-1 italic">Obs: {sale.notes}</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default Vendas