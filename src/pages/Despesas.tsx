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
}

export default function Despesas() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filtros
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  // Formulário nova despesa
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    description: '',
    value: '',
    date: '',
    categoryId: '',
    notes: ''
  })

  // Formulário nova categoria
  const [showCategoryForm, setShowCategoryForm] = useState(false)
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
      .catch(() => setError('Erro ao carregar despesas'))
      .finally(() => setLoading(false))
  }

  function fetchCategories() {
    api.get<ExpenseCategory[]>('/api/expense-categories')
      .then(res => setCategories(res.data))
      .catch(() => {})
  }

  function handleSaveExpense() {
    api.post('/api/expenses', {
      description: form.description,
      value: parseFloat(form.value),
      date: form.date,
      categoryId: parseInt(form.categoryId),
      notes: form.notes
    })
      .then(() => {
        setForm({ description: '', value: '', date: '', categoryId: '', notes: '' })
        setShowForm(false)
        fetchExpenses()
      })
      .catch(() => setError('Erro ao salvar despesa'))
  }

  function handleDeleteExpense(id: number) {
    api.delete(`/api/expenses/${id}`)
      .then(() => fetchExpenses())
      .catch(() => setError('Erro ao deletar despesa'))
  }

  function handleSaveCategory() {
    api.post('/api/expense-categories', categoryForm)
      .then(() => {
        setCategoryForm({ name: '', description: '' })
        setShowCategoryForm(false)
        fetchCategories()
      })
      .catch(() => setError('Erro ao salvar categoria'))
  }

  function handleDeleteCategory(id: number) {
    api.delete(`/api/expense-categories/${id}`)
      .then(() => fetchCategories())
      .catch(() => setError('Erro ao deletar categoria'))
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-medium">Despesas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Nova Despesa
        </button>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Formulário nova despesa */}
      {showForm && (
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
          <h2 className="text-white text-sm font-medium">Nova Despesa</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Descrição"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10"
            />
            <input
              type="number"
              placeholder="Valor (R$)"
              value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })}
              className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10"
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10"
            />
            <select
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
              className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="Observações (opcional)"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10 col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveExpense} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4 flex gap-3 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-white/50 text-xs">De</label>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)}
            className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white/50 text-xs">Até</label>
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
            className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-white/50 text-xs">Categoria</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10">
            <option value="">Todas</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button onClick={fetchExpenses} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          Filtrar
        </button>
      </div>

      {/* Total */}
      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4 flex justify-between items-center">
        <span className="text-white/50 text-sm">Total de despesas</span>
        <span className="text-red-400 text-lg font-medium">
          {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-white/30 text-sm">Carregando...</div>
        </div>
      ) : (
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Descrição</th>
                <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Categoria</th>
                <th className="text-left text-white/50 text-xs font-medium px-4 py-3">Data</th>
                <th className="text-right text-white/50 text-xs font-medium px-4 py-3">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-white/30 text-sm py-8">Nenhuma despesa encontrada</td>
                </tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="text-white text-sm px-4 py-3">{e.description}</td>
                  <td className="text-white/50 text-sm px-4 py-3">{e.categoryName}</td>
                  <td className="text-white/50 text-sm px-4 py-3">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                  <td className="text-red-400 text-sm px-4 py-3 text-right">
                    {e.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteExpense(e.id)} className="text-white/30 hover:text-red-400 text-xs">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Categorias */}
      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-sm font-medium">Categorias</h2>
          <button onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg">
            + Nova Categoria
          </button>
        </div>

        {showCategoryForm && (
          <div className="flex gap-2">
            <input
              placeholder="Nome da categoria"
              value={categoryForm.name}
              onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="bg-[#1a1d2e] text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10 flex-1"
            />
            <button onClick={handleSaveCategory} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              Salvar
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-white text-sm">{c.name}</span>
              <button onClick={() => handleDeleteCategory(c.id)} className="text-white/30 hover:text-red-400 text-xs">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}