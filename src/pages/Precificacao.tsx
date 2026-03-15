import { useState } from 'react'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getMarginColor(margin: number) {
  if (margin < 20) return 'text-red-400'
  if (margin < 35) return 'text-orange-400'
  if (margin < 50) return 'text-green-400'
  return 'text-blue-400'
}

function getMarginLabel(margin: number) {
  if (margin < 20) return 'Baixa'
  if (margin < 35) return 'Aceitável'
  if (margin < 50) return 'Boa'
  return 'Excelente'
}

function Precificacao() {
  const [cost, setCost] = useState('')
  const [value, setValue] = useState('')
  const [mode, setMode] = useState<'markup' | 'margin'>('markup')

  const costNum = parseFloat(cost) || 0
  const valueNum = parseFloat(value) || 0

  // Markup: custo + % sobre o custo
  // Margem: custo + preço de venda → calcula a margem
  const salePrice = mode === 'markup'
    ? costNum * (1 + valueNum / 100)
    : valueNum

  const profit = salePrice - costNum
  const markup = costNum > 0 ? (profit / costNum) * 100 : 0
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0

  const isValid = costNum > 0 && valueNum > 0 && salePrice > costNum

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-white text-lg font-medium">Calculadora de Precificação</h1>
        <p className="text-white/30 text-sm mt-0.5">Calcule o preço de venda ideal</p>
      </div>

      <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-6 flex flex-col gap-4">

        <div className="flex bg-[#0a0c14] rounded-lg p-1 gap-1">
          <button
            onClick={() => { setMode('markup'); setValue('') }}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${mode === 'markup' ? 'bg-[#2563eb] text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Markup
          </button>
          <button
            onClick={() => { setMode('margin'); setValue('') }}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${mode === 'margin' ? 'bg-[#2563eb] text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Margem
          </button>
        </div>

        <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
  <p className="text-white/40 text-xs mb-1">Margem</p>
  <p className={`text-xl font-medium ${getMarginColor(margin)}`}>
    {margin.toFixed(1)}%
  </p>
  <p className={`text-xs mt-1 ${getMarginColor(margin)}`}>
    {getMarginLabel(margin)}
  </p>
</div>

        <div className="flex flex-col gap-1.5">
          <label className="text-white/50 text-xs">Custo do produto (R$)</label>
          <input
            type="number"
            value={cost}
            onChange={e => setCost(e.target.value)}
            placeholder="0,00"
            step="0.01"
            className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#2563eb] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-white/50 text-xs">
            {mode === 'markup' ? 'Markup (%)' : 'Preço de venda (R$)'}
          </label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={mode === 'markup' ? 'Ex: 80' : '0,00'}
            step={mode === 'markup' ? '0.1' : '0.01'}
            className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#2563eb] transition-colors"
          />
        </div>
      </div>

      {isValid && (
        <div className="flex flex-col gap-3">
          <div className="bg-[#0d0f18] border border-[#2563eb]/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">
                {mode === 'markup' ? 'Preço de venda sugerido' : 'Preço de venda informado'}
              </p>
              <p className="text-white text-2xl font-medium">{formatCurrency(salePrice)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#1a3a6b] flex items-center justify-center">
              <span className="text-[#4e90d9] text-lg font-bold">R$</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Lucro</p>
              <p className="text-green-400 text-lg font-medium">{formatCurrency(profit)}</p>
            </div>
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Markup</p>
              <p className="text-white text-lg font-medium">{markup.toFixed(1)}%</p>
            </div>
            <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">Margem</p>
              <p className="text-white text-lg font-medium">{margin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-[#0d0f18] border border-white/10 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-3">Simulação de lucro</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[10, 50, 100].map(qty => (
                <div key={qty} className="bg-[#0a0c14] rounded-lg p-3">
                  <p className="text-white/30 text-xs mb-1">{qty} unidades</p>
                  <p className="text-green-400 text-sm font-medium">{formatCurrency(profit * qty)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Precificacao