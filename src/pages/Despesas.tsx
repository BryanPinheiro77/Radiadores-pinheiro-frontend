import { useState, useEffect } from 'react'
import api from '../api/axios'

interface ExpenseCategory {
  id: number
  name: string
  description: string
}

interface Expense {
  id: number
  description: string
  value: number
  date: string
  categoryId: number
  categoryName: string
  notes: string
  expenseType?: string
  totalInstallments?: number
  currentInstallment?: number
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Despesas() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [form, setForm] = useState({
    description: '', value: '', date: '', categoryId: '', notes: '',
    expenseType: 'SINGLE', totalInstallments: ''
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

  useEffect(() => {
    fetchCategories()
    fetchExpenses()
  }, [])

  function fetchExpenses() {
    setLoading(true)
    let url = '/api/expenses'
    const params: string[] = []
    if (filterStart) params.push(`start=${filterStart}`)
    if (filterEnd) params.push(`end=${filterEnd}`)
    if (filterCategory) params.push(`categoryId=${filterCategory}`)
    if (params.length > 0) url += '/filter?' + params.join('&')
    api.get<Expense[]>(url)
      .then(res => setExpenses(res.data))
      .finally(() => setLoading(false))
  }

  function fetchCategories() {
    api.get<ExpenseCategory[]>('/api/expense-categories')
      .then(res => setCategories(res.data))
  }

  function openCreate() {
    setEditing(null)
    setForm({ description: '', value: '', date: '', categoryId: '', notes: '', expenseType: 'SINGLE', totalInstallments: '' })
    setShowModal(true)
  }

  function openEdit(e: Expense) {
    setEditing(e)
    setForm({
      description: e.description,
      value: String(e.value),
      date: e.date,
      categoryId: String(e.categoryId),
      notes: e.notes ?? '',
      expenseType: e.expenseType ?? 'SINGLE',
      totalInstallments: e.totalInstallments ? String(e.totalInstallments) : ''
    })
    setShowModal(true)
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const body = {
      description: form.description,
      value: parseFloat(form.value),
      date: form.date,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      notes: form.notes || null,
      expenseType: form.expenseType,
      totalInstallments: form.expenseType === 'INSTALLMENT' && form.totalInstallments
        ? parseInt(form.totalInstallments) : null
    }
    try {
      if (editing) await api.put(`/api/expenses/${editing.id}`, body)
      else await api.post('/api/expenses', body)
      setShowModal(false)
      fetchExpenses()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Deletar despesa?')) return
    await api.delete(`/api/expenses/${id}`)
    fetchExpenses()
  }

  async function handleCategorySubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (submittingCategory) return
    setSubmittingCategory(true)
    try {
      if (editingCategory) await api.put(`/api/expense-categories/${editingCategory.id}`, categoryForm)
      else await api.post('/api/expense-categories', categoryForm)
      setCategoryForm({ name: '', description: '' })
      setEditingCategory(null)
      fetchCategories()
    } finally {
      setSubmittingCategory(false)
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Deletar categoria?')) return
    await api.delete(`/api/expense-categories/${id}`)
    fetchCategories()
  }

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase())
  )

  const total = filteredExpenses.reduce((sum, e) => sum + e.value, 0)

  function getTypeLabel(expense: Expense) {
    if (expense.expenseType === 'INSTALLMENT' && expense.totalInstallments && expense.currentInstallment) {
      return `${expense.currentInstallment}/${expense.totalInstallments}`
    }
    if (expense.expenseType === 'RECURRING') return '↻'
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Despesas</h1>
          <p className="text-white/30 text-sm mt-0.5">Registro e controle de gastos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryModal(true)}
            className="border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm px-4 py-2 rounded-lg transition-colors">
            Categorias
          </button>
          <button onClick={openCreate}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Nova despesa
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-white/30 text-xs">De</label>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)}
            className="bg-[#0d0f18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white/30 text-xs">Até</label>
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
            className="bg-[#0d0f18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white/30 text-xs">Categoria</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="bg-[#0d0f18] border border-white/10 text-white/60 text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb]">
            <option value="">Todas</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={fetchExpenses}
          className="bg-[#0d0f18] border border-white/10 text-white/60 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
          Filtrar
        </button>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-white/30 text-xs">Buscar</label>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full bg-[#0d0f18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb]" />
        </div>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <span className="text-white/40 text-sm">Total no período</span>
        <span className="text-red-400 text-xl font-medium">{formatCurrency(total)}</span>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Carregando...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">Nenhuma despesa encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/30 font-normal">Descrição</th>
                  <th className="text-left px-4 py-3 text-white/30 font-normal hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 text-white/30 font-normal hidden md:table-cell">Data</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Valor</th>
                  <th className="text-right px-4 py-3 text-white/30 font-normal">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white/80">{e.description}</span>
                        {getTypeLabel(e) && (
                          <span className="text-white/30 text-xs bg-white/5 px-1.5 py-0.5 rounded">
                            {getTypeLabel(e)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/40 hidden md:table-cell">{e.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-white/40 hidden md:table-cell">
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400 font-medium">{formatCurrency(e.value)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(e)} className="text-white/30 hover:text-[#4e90d9] text-xs transition-colors">Editar</button>
                        <button onClick={() => handleDelete(e.id)} className="text-white/30 hover:text-red-400 text-xs transition-colors">Deletar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl w-full max-w-md p-6">
            <h2 className="text-white font-medium mb-4">{editing ? 'Editar despesa' : 'Nova despesa'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição" required
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="Valor (R$)" type="number" step="0.01" required
                  className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
                <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  type="date" required
                  className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              </div>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm outline-none focus:border-[#2563eb]">
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/30 text-xs">Tipo</label>
                <div className="flex bg-[#0a0c14] rounded-lg p-1 gap-1 border border-white/10">
                  {[
                    { value: 'SINGLE', label: 'Única' },
                    { value: 'RECURRING', label: 'Recorrente' },
                    { value: 'INSTALLMENT', label: 'Parcelada' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, expenseType: opt.value, totalInstallments: '' }))}
                      className={`flex-1 text-xs py-1.5 rounded transition-colors ${form.expenseType === opt.value ? 'bg-[#2563eb] text-white' : 'text-white/40 hover:text-white/60'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.expenseType === 'RECURRING' && (
                <p className="text-white/30 text-xs bg-[#0a0c14] border border-white/5 rounded-lg px-3 py-2">
                  A despesa será registrada mensalmente a partir da data informada.
                </p>
              )}
              {form.expenseType === 'INSTALLMENT' && (
                <div className="flex flex-col gap-1">
                  <label className="text-white/30 text-xs">Número de parcelas</label>
                  <input value={form.totalInstallments}
                    onChange={e => setForm(f => ({ ...f, totalInstallments: e.target.value }))}
                    placeholder="Ex: 10" type="number" min="2" required
                    className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
                  <p className="text-white/20 text-xs">
                    {form.totalInstallments && form.value
                      ? `${form.totalInstallments}x de ${formatCurrency(parseFloat(form.value))} — Total: ${formatCurrency(parseFloat(form.value) * parseInt(form.totalInstallments))}`
                      : 'Informe o valor e o número de parcelas'}
                  </p>
                </div>
              )}
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observações (opcional)"
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-white/10 text-white/50 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors">
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
              <h2 className="text-white font-medium">Categorias de despesa</h2>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryForm({ name: '', description: '' }) }}
                className="text-white/30 hover:text-white transition-colors text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-2 mb-4">
              <input value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome da categoria" required
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <input value={categoryForm.description} onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#2563eb]" />
              <div className="flex gap-2">
                {editingCategory && (
                  <button type="button" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }) }}
                    className="flex-1 border border-white/10 text-white/40 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={submittingCategory}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors">
                  {submittingCategory ? 'Salvando...' : editingCategory ? 'Salvar' : '+ Adicionar'}
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