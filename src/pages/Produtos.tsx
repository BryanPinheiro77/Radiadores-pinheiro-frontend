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
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', costPrice: '', salePrice: '',
    stock: '', minStock: '', categoryId: '', active: true
  })

  function loadProducts() {
  setLoading(true)
  api.get<Product[]>('/products')
    .then(res => {
      setProducts(res.data)
      setTotalPages(1)
    })
    .finally(() => setLoading(false))
}

  useEffect(() => { loadProducts() }, [page, categoryFilter])
  useEffect(() => {
    api.get<Category[]>('/categories').then(res => setCategories(res.data))
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '', costPrice: '', salePrice: '', stock: '', minStock: '', categoryId: '', active: true })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name, description: p.description ?? '',
      costPrice: String(p.costPrice), salePrice: String(p.salePrice),
      stock: String(p.stock), minStock: String(p.minStock),
      categoryId: '', active: p.active
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Produtos</h1>
          <p className="text-white/30 text-sm mt-0.5">Gestão de estoque</p>
        </div>
        <button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Novo produto
        </button>
      </div>

      <div className="flex gap-2">
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
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Nenhum produto encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/30 font-normal">Nome</th>
                  <th className="text-left px-4 py-3 text-white/30 font-normal hidden md:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Custo</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Venda</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Estoque</th>
                  <th className="text-center px-4 py-3 text-white/30 font-normal">Status</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3 text-white/80">{p.name}</td>
                    <td className="px-4 py-3 text-white/40 hidden md:table-cell">{p.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-white/50">
                      {p.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">
                      {p.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${p.stock <= p.minStock ? 'text-red-400' : 'text-white/70'}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-center">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl w-full max-w-md p-6">
            <h2 className="text-white font-medium mb-4">{editing ? 'Editar produto' : 'Novo produto'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#4e90d9]" />
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#4e90d9]" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="Preço de custo" type="number" step="0.01" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#4e90d9]" />
                <input value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} placeholder="Preço de venda" type="number" step="0.01" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#4e90d9]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="Estoque" type="number" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#4e90d9]" />
                <input value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="Estoque mínimo" type="number" required className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#4e90d9]" />
              </div>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm outline-none focus:border-[#4e90d9]">
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
    </div>
  )
}

export default Produtos