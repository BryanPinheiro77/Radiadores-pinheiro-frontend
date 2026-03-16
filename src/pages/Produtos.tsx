import { useState, useEffect } from 'react'
import api from '../api/axios'
import type { Product, Category, Page } from '../types'

function Produtos() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', costPrice: '', salePrice: '',
    stock: '', minStock: '', categoryId: '', active: true
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

  function loadProducts() {
    setLoading(true)
    api.get<Product[]>('/products')
      .then(res => {
        setProducts(res.data)
        setTotalPages(1)
      })
      .finally(() => setLoading(false))
  }

  function loadCategories() {
    api.get<Category[]>('/categories').then(res => setCategories(res.data))
  }

  useEffect(() => { loadProducts() }, [page, categoryFilter])
  useEffect(() => { loadCategories() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '', costPrice: '', salePrice: '', stock: '', minStock: '', categoryId: '', active: true })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    const matchedCategory = categories.find(c => c.name === p.categoryName)
    setForm({
      name: p.name,
      description: p.description ?? '',
      costPrice: String(p.costPrice),
      salePrice: String(p.salePrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      categoryId: matchedCategory ? String(matchedCategory.id) : '',
      active: p.active
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      name: form.name, description: form.description,
      costPrice: Number(form.costPrice), salePrice: Number(form.salePrice),
      stock: Number(form.stock), minStock: Number(form.minStock),
      categoryId: form.categoryId ? Number(form.categoryId) : null
    }
    if (editing) {
      await api.put(`/products/${editing.id}`, body)
    } else {
      await api.post('/products', body)
    }
    setShowModal(false)
    loadProducts()
  }

  async function handleToggle(id: number) {
    await api.patch(`/products/${id}/toggle-active`)
    loadProducts()
  }

  async function handleDelete(id: number) {
    if (!confirm('Deletar produto?')) return
    await api.delete(`/products/${id}`)
    loadProducts()
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingCategory) {
      await api.put(`/categories/${editingCategory.id}`, categoryForm)
    } else {
      await api.post('/categories', categoryForm)
    }
    setCategoryForm({ name: '', description: '' })
    setEditingCategory(null)
    loadCategories()
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Deletar categoria?')) return
    await api.delete(`/categories/${id}`)
    loadCategories()
  }

  // Filtragem local por nome e categoria
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter
      ? p.categoryName === categories.find(c => String(c.id) === categoryFilter)?.name
      : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Produtos</h1>
          <p className="text-white/30 text-sm mt-0.5">Gestão de estoque</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryModal(true)}
            className="border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm px-4 py-2 rounded-lg transition-colors">
            Categorias
          </button>
          <button onClick={openCreate}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Novo produto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="bg-[#0d0f18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb] flex-1 min-w-[160px]"
        />
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}
          className="bg-[#0d0f18] border border-white/10 text-white/60 text-sm rounded-lg px-3 py-2 outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Carregando...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Nenhum produto encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/30 font-normal">Nome</th>
                  <th className="text-left px-4 py-3 text-white/30 font-normal hidden lg:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal hidden md:table-cell">Custo</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Venda</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Estoque</th>
                  <th className="text-center px-4 py-3 text-white/30 font-normal hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3">
                      <p className="text-white/80">{p.name}</p>
                      {p.description && (
                        <p className="text-white/30 text-xs mt-0.5 truncate max-w-[200px]">{p.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 hidden lg:table-cell">{p.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-white/50 hidden md:table-cell">
                      {p.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">
                      {p.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${p.stock <= p.minStock ? 'text-red-400' : 'text-white/70'}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <button onClick={() => handleToggle(p.id)} className={`text-xs px-2 py-0.5 rounded-md ${p.active ? 'bg-green-900/40 text-green-400' : 'bg-white/5 text-white/30'}`}>
                        {p.active ? 'ativo' : 'inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="text-white/30 hover:text-[#4e90d9] text-xs transition-colors">Editar</button>
                        <button onClick={() => handleDelete(p.id)} className="text-white/30 hover:text-red-400 text-xs transition-colors">Deletar</button>
                      </div>
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
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-3 py-1">
            ← Anterior
          </button>
          <span className="text-white/30 text-sm">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-3 py-1">
            Próximo →
          </button>
        </div>
      )}

      {/* Modal produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl w-full max-w-md p-6">
            <h2 className="text-white font-medium mb-4">{editing ? 'Editar produto' : 'Novo produto'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição (opcional)" className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="Preço de custo" type="number" step="0.01" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
                <input value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} placeholder="Preço de venda" type="number" step="0.01" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="Estoque" type="number" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
                <input value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="Estoque mínimo" type="number" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              </div>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm outline-none focus:border-[#2563eb]">
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-white/10 text-white/50 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm py-2 rounded-lg transition-colors">
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal categorias */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">Categorias</h2>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryForm({ name: '', description: '' }) }}
                className="text-white/30 hover:text-white transition-colors text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-2 mb-4">
              <input value={categoryForm.name}
                onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome da categoria" required
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <input value={categoryForm.description}
                onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <div className="flex gap-2">
                {editingCategory && (
                  <button type="button"
                    onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }) }}
                    className="flex-1 border border-white/10 text-white/40 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                )}
                <button type="submit"
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm py-2 rounded-lg transition-colors">
                  {editingCategory ? 'Salvar' : '+ Adicionar'}
                </button>
              </div>
            </form>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-4">Nenhuma categoria cadastrada</p>
              ) : categories.map(c => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5">
                  <div>
                    <p className="text-white/80 text-sm">{c.name}</p>
                    {c.description && <p className="text-white/30 text-xs">{c.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCategory(c); setCategoryForm({ name: c.name, description: c.description ?? '' }) }}
                      className="text-white/30 hover:text-[#4e90d9] text-xs transition-colors">Editar</button>
                    <button onClick={() => handleDeleteCategory(c.id)}
                      className="text-white/30 hover:text-red-400 text-xs transition-colors">Deletar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Produtos