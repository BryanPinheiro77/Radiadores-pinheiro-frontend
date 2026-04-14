import { useEffect, useState } from 'react'
import api from '../api/axios'
import type { Product, Category, Page } from '../types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400

function Produtos() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittingCategory, setSubmittingCategory] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    costPrice: '',
    salePrice: '',
    stock: '',
    minStock: '',
    categoryId: '',
    active: true
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  })

  async function loadProducts(currentPage: number, currentSearch: string, currentCategory: string) {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('size', String(PAGE_SIZE))
      params.set('sort', 'name,asc')

      if (currentSearch.trim()) {
        params.set('search', currentSearch.trim())
      }

      if (currentCategory) {
        params.set('categoryId', currentCategory)
      }

      const res = await api.get<Page<Product>>(`/products?${params.toString()}`)

      setProducts(res.data.content)
      setTotalPages(Math.max(1, res.data.totalPages))
      setPage(res.data.number)
    } finally {
      setLoading(false)
    }
  }

  function loadCategories() {
    api.get<Category[]>('/categories').then(res => setCategories(res.data))
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    loadProducts(page, debouncedSearch, categoryFilter)
  }, [page, debouncedSearch, categoryFilter])

  function openCreate() {
    setEditing(null)
    setForm({
      name: '',
      description: '',
      costPrice: '',
      salePrice: '',
      stock: '',
      minStock: '',
      categoryId: '',
      active: true
    })
    setShowModal(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    const matchedCategory = categories.find(c => c.name === product.categoryName)

    setForm({
      name: product.name,
      description: product.description ?? '',
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      categoryId: matchedCategory ? String(matchedCategory.id) : '',
      active: product.active
    })

    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)

    const body = {
      name: form.name,
      description: form.description,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      categoryId: form.categoryId ? Number(form.categoryId) : null
    }

    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, body)
      } else {
        await api.post('/products', body)
      }

      setShowModal(false)
      await loadProducts(page, debouncedSearch, categoryFilter)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(id: number) {
    await api.patch(`/products/${id}/toggle-active`)
    await loadProducts(page, debouncedSearch, categoryFilter)
  }

  async function handleDelete(id: number) {
    if (!confirm('Deletar produto?')) return

    await api.delete(`/products/${id}`)

    const isLastItemOnPage = products.length === 1 && page > 0

    if (isLastItemOnPage) {
      setPage(prev => prev - 1)
      return
    }

    await loadProducts(page, debouncedSearch, categoryFilter)
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingCategory) return

    setSubmittingCategory(true)

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, categoryForm)
      } else {
        await api.post('/categories', categoryForm)
      }

      setCategoryForm({ name: '', description: '' })
      setEditingCategory(null)
      loadCategories()
      await loadProducts(page, debouncedSearch, categoryFilter)
    } finally {
      setSubmittingCategory(false)
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Deletar categoria?')) return

    await api.delete(`/categories/${id}`)
    loadCategories()

    if (categoryFilter === String(id)) {
      setCategoryFilter('')
      setPage(0)
      return
    }

    await loadProducts(page, debouncedSearch, categoryFilter)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Produtos</h1>
          <p className="text-white/30 text-sm mt-0.5">Gestão de estoque</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Categorias
          </button>

          <button
            onClick={openCreate}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Novo produto
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Buscar por nome..."
          className="bg-[#0d0f18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb] flex-1 min-w-[160px]"
        />

        <select
          value={categoryFilter}
          onChange={e => {
            setCategoryFilter(e.target.value)
            setPage(0)
          }}
          className="bg-[#0d0f18] border border-white/10 text-white/60 text-sm rounded-lg px-3 py-2 outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Carregando...
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Nenhum produto encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead>
                <tr className="border-b border-white/5 align-top">
                  <th className="text-left px-4 py-3 text-white/30 font-normal">Nome</th>
                  <th className="text-left px-4 py-3 text-white/30 font-normal">
                    Categoria
                  </th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal hidden md:table-cell">
                    Custo
                  </th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Venda</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Estoque</th>
                  <th className="text-center px-4 py-3 text-white/30 font-normal hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Ações</th>
                </tr>
              </thead>

              <tbody>
                {products.map(product => (
                  <tr
                    key={product.id}
                    className="border-b border-white/5 hover:bg-white/2 align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <p className="text-white/80 text-sm leading-5 break-words whitespace-normal">
                          {product.name}
                        </p>

                        {product.description ? (
                          <p className="text-white/30 text-xs leading-4 mt-0.5 break-words whitespace-normal">
                            {product.description}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-white/40 text-sm leading-5 break-words whitespace-normal">
                      {product.categoryName ?? '—'}
                    </td>

                    <td className="px-4 py-3 text-right text-white/50 text-sm leading-5 hidden md:table-cell whitespace-nowrap">
                      {product.costPrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>

                    <td className="px-4 py-3 text-right text-white/70 text-sm leading-5 whitespace-nowrap">
                      {product.salePrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>

                    <td
                      className={`px-4 py-3 text-right text-sm leading-5 font-medium whitespace-nowrap ${
                        product.stock <= product.minStock ? 'text-red-400' : 'text-white/70'
                      }`}
                    >
                      {product.stock}
                    </td>

                    <td className="px-4 py-3 text-center hidden md:table-cell whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(product.id)}
                        className={`text-xs px-2 py-0.5 rounded-md ${
                          product.active
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-white/5 text-white/30'
                        }`}
                      >
                        {product.active ? 'ativo' : 'inativo'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="text-white/30 hover:text-[#4e90d9] text-xs transition-colors"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-white/30 hover:text-red-400 text-xs transition-colors"
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-3 py-1"
        >
          ← Anterior
        </button>

        <span className="text-white/30 text-sm">
          {page + 1} / {totalPages}
        </span>

        <button
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1 || loading}
          className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-3 py-1"
        >
          Próximo →
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl w-full max-w-md p-6">
            <h2 className="text-white font-medium mb-4">
              {editing ? 'Editar produto' : 'Novo produto'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome"
                required
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.costPrice}
                  onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                  placeholder="Preço de custo"
                  type="number"
                  step="0.01"
                  required
                  className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                />

                <input
                  value={form.salePrice}
                  onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                  placeholder="Preço de venda"
                  type="number"
                  step="0.01"
                  required
                  className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="Estoque"
                  type="number"
                  required
                  className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                />

                <input
                  value={form.minStock}
                  onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                  placeholder="Estoque mínimo"
                  type="number"
                  required
                  className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
                />
              </div>

              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm outline-none focus:border-[#2563eb]"
              >
                <option value="">Sem categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 border border-white/10 text-white/50 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors"
                >
                  {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">Categorias</h2>

              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '' })
                }}
                className="text-white/30 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-2 mb-4">
              <input
                value={categoryForm.name}
                onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome da categoria"
                required
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <input
                value={categoryForm.description}
                onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]"
              />

              <div className="flex gap-2">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryForm({ name: '', description: '' })
                    }}
                    className="flex-1 border border-white/10 text-white/40 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors"
                >
                  {submittingCategory ? 'Salvando...' : editingCategory ? 'Salvar' : '+ Adicionar'}
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-4">
                  Nenhuma categoria cadastrada
                </p>
              ) : (
                categories.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5"
                  >
                    <div>
                      <p className="text-white/80 text-sm">{c.name}</p>
                      {c.description && (
                        <p className="text-white/30 text-xs">{c.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(c)
                          setCategoryForm({
                            name: c.name,
                            description: c.description ?? ''
                          })
                        }}
                        className="text-white/30 hover:text-[#4e90d9] text-xs transition-colors"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-white/30 hover:text-red-400 text-xs transition-colors"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Produtos