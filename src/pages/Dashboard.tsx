import { useEffect, useState } from 'react'
import api from '../api/axios'
import type { ReportResponse } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(value: number) {
  return value.toFixed(1) + '%'
}

interface MonthlyChartPoint {
  mes: string
  faturamento: number
  despesas: number
}

interface DashboardSummaryResponse {
  currentMonthReport: ReportResponse
  totalRevenue: number
  totalExpenses: number
  balance: number
  monthlyChart: MonthlyChartPoint[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  useEffect(() => {
    setLoading(true)
    setError('')

    api.get<DashboardSummaryResponse>(`/api/dashboard/summary?start=${start}&end=${end}`)
      .then(res => setData(res.data))
      .catch(() => setError('Erro ao carregar dashboard'))
      .finally(() => setLoading(false))
  }, [start, end])

  const report = data?.currentMonthReport ?? null
  const saldoMes = (report?.totalRevenue ?? 0) - (report?.totalExpenses ?? 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/30 text-sm">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white text-lg font-medium">Dashboard</h1>
        <p className="text-white/30 text-sm mt-0.5">Mês atual</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Faturamento</p>
          <p className="text-green-400 text-xl font-medium">
            {formatCurrency(report?.totalRevenue ?? 0)}
          </p>
        </div>

        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Despesas</p>
          <p className="text-red-400 text-xl font-medium">
            {formatCurrency(report?.totalExpenses ?? 0)}
          </p>
        </div>

        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Lucro estimado</p>
          <p className="text-white text-xl font-medium">
            {formatCurrency(report?.estimatedProfit ?? 0)}
          </p>
        </div>

        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Margem média</p>
          <p className="text-white text-xl font-medium">
            {formatPercent(report?.averageMargin ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`border rounded-xl p-4 flex items-center justify-between ${saldoMes >= 0 ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
          <div>
            <p className="text-white/40 text-xs mb-1">Saldo do mês</p>
            <p className={`text-2xl font-medium ${saldoMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(saldoMes)}
            </p>
            <p className="text-white/20 text-xs mt-0.5">Faturamento − Despesas</p>
          </div>
          <div className={`text-4xl ${saldoMes >= 0 ? 'text-green-400/20' : 'text-red-400/20'}`}>
            {saldoMes >= 0 ? '↑' : '↓'}
          </div>
        </div>

        <div className={`border rounded-xl p-4 flex items-center justify-between ${((data?.balance ?? 0) >= 0) ? 'bg-blue-900/10 border-blue-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
          <div>
            <p className="text-white/40 text-xs mb-1">Caixa total acumulado</p>
            <p className={`text-2xl font-medium ${(data?.balance ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {formatCurrency(data?.balance ?? 0)}
            </p>
            <p className="text-white/20 text-xs mt-0.5">Todo o histórico</p>
          </div>
          <div className={`text-4xl ${(data?.balance ?? 0) >= 0 ? 'text-blue-400/20' : 'text-red-400/20'}`}>
            {(data?.balance ?? 0) >= 0 ? '↑' : '↓'}
          </div>
        </div>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
        <h2 className="text-white/60 text-sm font-medium mb-4">Faturamento vs Despesas — últimos 6 meses</h2>

        {!data?.monthlyChart || data.monthlyChart.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-white/20 text-sm">
            Sem dados para o gráfico
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyChart} barGap={4} barCategoryGap="30%">
              <XAxis
                dataKey="mes"
                tick={{ fill: '#ffffff40', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#ffffff40', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: '#13151f',
                  border: '1px solid #ffffff15',
                  borderRadius: 8
                }}
                labelStyle={{ color: '#ffffff60', fontSize: 12 }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend
                wrapperStyle={{
                  color: '#ffffff60',
                  fontSize: 12,
                  paddingTop: 8
                }}
              />
              <Bar dataKey="faturamento" name="Faturamento" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <h2 className="text-white/60 text-sm font-medium mb-3">Mais vendidos</h2>

          {report?.bestSellingProducts.length === 0 ? (
            <p className="text-white/20 text-sm">Nenhuma venda no período</p>
          ) : (
            <div className="flex flex-col gap-2">
              {report?.bestSellingProducts.slice(0, 5).map(product => (
                <div key={product.productId} className="flex items-center justify-between">
                  <span className="text-white/70 text-sm truncate max-w-[60%]">
                    {product.productName}
                  </span>
                  <span className="text-white/40 text-xs">
                    {product.totalQuantitySold} un
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <h2 className="text-white/60 text-sm font-medium mb-3">Estoque crítico</h2>

          {report?.productsBelowMinStock.length === 0 ? (
            <p className="text-white/20 text-sm">Nenhum produto abaixo do mínimo</p>
          ) : (
            <div className="flex flex-col gap-2">
              {report?.productsBelowMinStock.slice(0, 5).map(product => (
                <div key={product.productId} className="flex items-center justify-between">
                  <span className="text-white/70 text-sm truncate max-w-[60%]">
                    {product.productName}
                  </span>
                  <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-md">
                    {product.currentStock}/{product.minimumStock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
        <h2 className="text-white/60 text-sm font-medium mb-3">Mais lucrativos</h2>

        {report?.mostProfitableProducts.length === 0 ? (
          <p className="text-white/20 text-sm">Nenhuma venda no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/20 text-xs">
                  <th className="text-left pb-2 font-normal">Produto</th>
                  <th className="text-right pb-2 font-normal">Qtd</th>
                  <th className="text-right pb-2 font-normal hidden md:table-cell">Receita</th>
                  <th className="text-right pb-2 font-normal">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {report?.mostProfitableProducts.slice(0, 5).map(product => (
                  <tr key={product.productId} className="border-t border-white/5">
                    <td className="py-2 text-white/70 truncate max-w-[140px]">
                      {product.productName}
                    </td>
                    <td className="py-2 text-right text-white/40">
                      {product.totalQuantitySold}
                    </td>
                    <td className="py-2 text-right text-white/60 hidden md:table-cell">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="py-2 text-right text-green-400">
                      {formatCurrency(product.totalProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}