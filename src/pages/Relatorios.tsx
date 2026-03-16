import { useState } from 'react'
import api from '../api/axios'
import type { ReportResponse } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(value: number) {
  return value.toFixed(1) + '%'
}

type Period = 'today' | 'week' | 'month' | 'custom'

interface CategoryRevenue {
  categoryName: string
  totalRevenue: number
}

interface CategoryExpense {
  categoryName: string
  totalExpenses: number
}

interface CategoryProfit {
  categoryName: string
  totalRevenue: number
  totalProfit: number
}

function getPeriodDates(period: Period, customStart: string, customEnd: string) {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (period === 'today') return { start: fmt(today), end: fmt(today) }
  if (period === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return { start: fmt(start), end: fmt(today) }
  }
  if (period === 'month') {
    return {
      start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
      end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    }
  }
  return { start: customStart, end: customEnd }
}

const COLORS_BLUE = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
const COLORS_RED = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']
const COLORS_GREEN = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']

export default function Relatorios() {
  const [period, setPeriod] = useState<Period>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([])
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([])
  const [categoryProfit, setCategoryProfit] = useState<CategoryProfit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchReport() {
    const { start, end } = getPeriodDates(period, customStart, customEnd)
    if (!start || !end) {
      setError('Informe o período personalizado')
      return
    }
    setError('')
    setLoading(true)

    try {
      const [reportRes, catRevenueRes, catExpensesRes, catProfitRes] = await Promise.all([
        api.get<ReportResponse>(`/api/reports?start=${start}&end=${end}`),
        api.get<CategoryRevenue[]>(`/api/reports/category-revenue?start=${start}&end=${end}`),
        api.get<CategoryExpense[]>(`/api/reports/category-expenses?start=${start}&end=${end}`),
        api.get<CategoryProfit[]>(`/api/reports/category-profit?start=${start}&end=${end}`),
      ])
      setReport(reportRes.data)
      setCategoryRevenue(catRevenueRes.data)
      setCategoryExpenses(catExpensesRes.data)
      setCategoryProfit(catProfitRes.data)
    } catch {
      setError('Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }

  const profitableChartData = report?.mostProfitableProducts.slice(0, 8).map(p => ({
    name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
    lucro: p.totalProfit,
  })) ?? []

  const categoryRevenueChartData = categoryRevenue.slice(0, 8).map(c => ({
    name: c.categoryName.length > 15 ? c.categoryName.substring(0, 15) + '...' : c.categoryName,
    faturamento: c.totalRevenue,
  }))

  const categoryExpensesChartData = categoryExpenses.slice(0, 8).map(c => ({
    name: c.categoryName.length > 15 ? c.categoryName.substring(0, 15) + '...' : c.categoryName,
    despesas: c.totalExpenses,
  }))

  const categoryProfitChartData = categoryProfit.slice(0, 8).map(c => ({
    name: c.categoryName.length > 15 ? c.categoryName.substring(0, 15) + '...' : c.categoryName,
    lucro: c.totalProfit,
  }))

  const lowTurnoverProducts = report?.bestSellingProducts
    .filter(p => p.totalQuantitySold <= 2)
    .sort((a, b) => a.totalQuantitySold - b.totalQuantitySold) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white text-lg font-medium">Relatórios</h1>
        <p className="text-white/30 text-sm mt-0.5">Análise de desempenho da oficina</p>
      </div>

      {/* Filtro de período */}
      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-white/30 text-xs">Período</label>
          <div className="flex bg-[#0a0c14] rounded-lg p-1 gap-1 border border-white/10">
            {[
              { value: 'today', label: 'Hoje' },
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
              { value: 'custom', label: 'Personalizado' },
            ].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setPeriod(opt.value as Period)}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${period === opt.value ? 'bg-[#2563eb] text-white' : 'text-white/40 hover:text-white/60'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-white/30 text-xs">De</label>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="bg-[#0a0c14] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/30 text-xs">Até</label>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="bg-[#0a0c14] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563eb]" />
            </div>
          </>
        )}

        <button onClick={fetchReport} disabled={loading}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {loading ? 'Carregando...' : 'Gerar relatório'}
        </button>

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {report && (
        <>
          {/* Cards de indicadores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Faturamento</p>
              <p className="text-green-400 text-xl font-medium">{formatCurrency(report.totalRevenue)}</p>
            </div>
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Despesas</p>
              <p className="text-red-400 text-xl font-medium">{formatCurrency(report.totalExpenses)}</p>
            </div>
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Lucro estimado</p>
              <p className={`text-xl font-medium ${report.estimatedProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(report.estimatedProfit)}
              </p>
            </div>
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Margem média</p>
              <p className="text-white text-xl font-medium">{formatPercent(report.averageMargin)}</p>
            </div>
          </div>

          {/* Gráfico de mais lucrativos por produto */}
          {profitableChartData.length > 0 && (
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <h2 className="text-white/60 text-sm font-medium mb-4">Produtos e serviços mais lucrativos</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={profitableChartData} layout="vertical" barCategoryGap="25%">
                  <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 11 }}
                    axisLine={false} tickLine={false} width={110} />
                  <Tooltip contentStyle={{ background: '#13151f', border: '1px solid #ffffff15', borderRadius: 8 }}
                    labelStyle={{ color: '#ffffff60', fontSize: 12 }}
                    formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="lucro" name="Lucro" radius={[0, 4, 4, 0]}>
                    {profitableChartData.map((_, index) => (
                      <Cell key={index} fill={COLORS_BLUE[index % COLORS_BLUE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráficos de categorias — 3 lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {categoryRevenueChartData.length > 0 && (
              <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
                <h2 className="text-white/60 text-sm font-medium mb-4">Categorias — faturamento</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={categoryRevenueChartData} layout="vertical" barCategoryGap="25%">
                    <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }}
                      axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#13151f', border: '1px solid #ffffff15', borderRadius: 8 }}
                      labelStyle={{ color: '#ffffff60', fontSize: 12 }}
                      formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="faturamento" name="Faturamento" radius={[0, 4, 4, 0]}>
                      {categoryRevenueChartData.map((_, index) => (
                        <Cell key={index} fill={COLORS_BLUE[index % COLORS_BLUE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {categoryProfitChartData.length > 0 && (
              <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
                <h2 className="text-white/60 text-sm font-medium mb-4">Categorias — lucro</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={categoryProfitChartData} layout="vertical" barCategoryGap="25%">
                    <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }}
                      axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#13151f', border: '1px solid #ffffff15', borderRadius: 8 }}
                      labelStyle={{ color: '#ffffff60', fontSize: 12 }}
                      formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="lucro" name="Lucro" radius={[0, 4, 4, 0]}>
                      {categoryProfitChartData.map((_, index) => (
                        <Cell key={index} fill={COLORS_GREEN[index % COLORS_GREEN.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {categoryExpensesChartData.length > 0 && (
              <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
                <h2 className="text-white/60 text-sm font-medium mb-4">Categorias — despesas</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={categoryExpensesChartData} layout="vertical" barCategoryGap="25%">
                    <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }}
                      axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#13151f', border: '1px solid #ffffff15', borderRadius: 8 }}
                      labelStyle={{ color: '#ffffff60', fontSize: 12 }}
                      formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="despesas" name="Despesas" radius={[0, 4, 4, 0]}>
                      {categoryExpensesChartData.map((_, index) => (
                        <Cell key={index} fill={COLORS_RED[index % COLORS_RED.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mais vendidos */}
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <h2 className="text-white/60 text-sm font-medium mb-3">Mais vendidos no período</h2>
              {report.bestSellingProducts.length === 0 ? (
                <p className="text-white/20 text-sm">Nenhuma venda no período</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {report.bestSellingProducts.slice(0, 8).map((p, idx) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="text-white/20 text-xs w-4">{idx + 1}</span>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-white/70 text-sm truncate max-w-[60%]">{p.productName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs">{p.totalQuantitySold} un</span>
                          <span className="text-green-400 text-xs">{formatCurrency(p.totalRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Produtos abaixo do mínimo */}
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <h2 className="text-white/60 text-sm font-medium mb-3">Produtos abaixo do estoque mínimo</h2>
              {report.productsBelowMinStock.length === 0 ? (
                <p className="text-white/20 text-sm">Nenhum produto abaixo do mínimo</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {report.productsBelowMinStock.map(p => (
                    <div key={p.productId} className="flex items-center justify-between">
                      <span className="text-white/70 text-sm truncate max-w-[60%]">{p.productName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 text-xs font-medium">{p.currentStock} un</span>
                        <span className="text-white/20 text-xs">/ mín {p.minimumStock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Baixo giro */}
          {lowTurnoverProducts.length > 0 && (
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <h2 className="text-white/60 text-sm font-medium mb-1">Produtos com baixo giro</h2>
              <p className="text-white/20 text-xs mb-3">Vendidos 2 ou menos vezes no período</p>
              <div className="flex flex-col gap-2">
                {lowTurnoverProducts.map(p => (
                  <div key={p.productId} className="flex items-center justify-between">
                    <span className="text-white/70 text-sm truncate max-w-[60%]">{p.productName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 text-xs">{p.totalQuantitySold} un vendidas</span>
                      <span className="text-white/30 text-xs">{formatCurrency(p.totalRevenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabela completa */}
          <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
            <h2 className="text-white/60 text-sm font-medium mb-3">Análise completa por produto</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/20 text-xs border-b border-white/5">
                    <th className="text-left pb-2 font-normal">#</th>
                    <th className="text-left pb-2 font-normal">Produto</th>
                    <th className="text-right pb-2 font-normal">Qtd vendida</th>
                    <th className="text-right pb-2 font-normal hidden md:table-cell">Receita</th>
                    <th className="text-right pb-2 font-normal">Lucro</th>
                  </tr>
                </thead>
                <tbody>
                  {report.mostProfitableProducts.map((p, idx) => (
                    <tr key={p.productId} className="border-t border-white/5">
                      <td className="py-2 text-white/20 text-xs">{idx + 1}</td>
                      <td className="py-2 text-white/70">{p.productName}</td>
                      <td className="py-2 text-right text-white/40">{p.totalQuantitySold}</td>
                      <td className="py-2 text-right text-white/50 hidden md:table-cell">{formatCurrency(p.totalRevenue)}</td>
                      <td className="py-2 text-right text-green-400">{formatCurrency(p.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="flex items-center justify-center h-48 text-white/20 text-sm">
          Selecione um período e clique em "Gerar relatório"
        </div>
      )}
    </div>
  )
}