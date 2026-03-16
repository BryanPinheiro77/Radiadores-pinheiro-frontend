import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-radiadores.jpg'

const navItems = [
  { section: 'Principal', items: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/vendas', label: 'Vendas' },
  ]},
  { section: 'Estoque', items: [
    { to: '/produtos', label: 'Produtos' },
    { to: '/reposicao', label: 'Reposição' },
    { to: '/precificacao', label: 'Precificação' },
  ]},
  { section: 'Financeiro', items: [
    { to: '/despesas', label: 'Despesas' },
    { to: '/relatorios', label: 'Relatórios' },
  ]},
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-[#0d0f18] border-r border-white/10 z-30 flex flex-col
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="RP" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-white text-sm font-medium leading-tight">Radiadores Pinheiro</p>
              <p className="text-white/30 text-xs">Gestão Operacional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {navItems.map((group) => (
            <div key={group.section} className="mb-2">
              <p className="text-white/20 text-[10px] uppercase tracking-widest px-2 py-2">
                {group.section}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-0.5
                    ${isActive
                      ? 'bg-[#1a3a6b] text-[#4e90d9]'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                  `}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1a3a6b] flex items-center justify-center text-[#4e90d9] text-xs font-medium">
                RP
              </div>
              <span className="text-white/40 text-xs">Radiadores Pinheiro</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar