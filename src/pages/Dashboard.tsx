import { useState, useEffect } from 'react'
import api from '../api/axios'
import type { ReportResponse } from '../types'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(value: number) {
  return value.toFixed(1) + '%'
}

export default function Dashboard() {
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  useEffect(() => {
    api.get<ReportResponse>(`/api/reports?start=${start}&end=${end}`)
      .then(res => setReport(res.data))
      .catch(() => setError('Erro ao carregar relatório'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-white/30 text-sm">Carregando...</div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-red-400 text-sm">{error}</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white text-lg font-medium">Dashboard</h1>
        <p className="text-white/30 text-sm mt-0.5">Mês atual</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Faturamento</p>
          <p className="text-green-400 text-xl font-medium">{formatCurrency(report?.totalRevenue ?? 0)}</p>
        </div>
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Despesas</p>
          <p className="text-red-400 text-xl font-medium">{formatCurrency(report?.totalExpenses ?? 0)}</p>
        </div>
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Lucro estimado</p>
          <p className="text-white text-xl font-medium">{formatCurrency(report?.estimatedProfit ?? 0)}</p>
        </div>
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-1">Margem média</p>
          <p className="text-white text-xl font-medium">{formatPercent(report?.averageMargin ?? 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produtos mais vendidos */}
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <h2 className="text-white/60 text-sm font-medium mb-3">Mais vendidos</h2>
          {report?.bestSellingProducts.length === 0 ? (
            <p className="text-white/20 text-sm">Nenhuma venda no período</p>
          ) : (
            <div className="flex flex-col gap-2">
              {report?.bestSellingProducts.slice(0, 5).map((p) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <span className="text-white/70 text-sm truncate max-w-[60%]">{p.productName}</span>
                  <span className="text-white/40 text-xs">{p.totalQuantitySold} un</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estoque crítico */}
        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
          <h2 className="text-white/60 text-sm font-medium mb-3">Estoque crítico</h2>
          {report?.productsBelowMinStock.length === 0 ? (
            <p className="text-white/20 text-sm">Nenhum produto abaixo do mínimo</p>
          ) : (
            <div className="flex flex-col gap-2">
              {report?.productsBelowMinStock.slice(0, 5).map((p) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <span className="text-white/70 text-sm truncate max-w-[60%]">{p.productName}</span>
                  <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-md">
                    {p.currentStock}/{p.minimumStock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Produtos mais lucrativos */}
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
                  <th className="text-right pb-2 font-normal">Receita</th>
                  <th className="text-right pb-2 font-normal">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {report?.mostProfitableProducts.slice(0, 5).map((p) => (
                  <tr key={p.productId} className="border-t border-white/5">
                    <td className="py-2 text-white/70 truncate max-w-[140px]">{p.productName}</td>
                    <td className="py-2 text-right text-white/40">{p.totalQuantitySold}</td>
                    <td className="py-2 text-right text-white/60">{formatCurrency(p.totalRevenue)}</td>
                    <td className="py-2 text-right text-green-400">{formatCurrency(p.totalProfit)}</td>
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