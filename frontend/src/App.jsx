import { useEffect, useMemo, useState } from 'react'

import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Trash2,
  Users,
  Warehouse,
  X,
} from 'lucide-react'

import api from './api/axiosInstance'
import Toast from './components/Toast'
import logo from './assets/logo.svg'
import './global.css'

const NAV = [
  {
    key: 'home',
    label: 'Menu Principal',
    icon: Home,
    description: 'Visão geral com indicadores, status operacional e atividade recente.',
  },
  {
    key: 'products',
    label: 'Gerenciar Produtos',
    icon: Package,
    description: 'Base de cadastro, filtros, tabela e pontos de integração para os produtos.',
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Resumo analítico, comparativos mensais e blocos preparados para gráficos.',
  },
  {
    key: 'stock',
    label: 'Gerenciar Estoque',
    icon: Warehouse,
    description: 'Controle de entradas, saídas, posições de estoque e alertas de reposição.',
  },
  {
    key: 'employees',
    label: 'Funcionários',
    icon: Users,
    description: 'Estrutura de equipe, permissões, status e acompanhamento operacional.',
  },
]

const HOME_METRICS = [
  {
    key: 'totalKg',
    label: 'Total de Produtos em Kg',
    value: '--',
    hint: 'Integração ativa com /api/menu/metrics.',
    tone: 'green',
  },
  {
    key: 'availability',
    label: 'Variações disponíveis',
    value: '--',
    hint: 'Integração ativa com /api/menu/metrics.',
    tone: 'orange',
  },
  {
    key: 'billing',
    label: 'Faturamento mensal - Dados Fictícios',
    value: 'R$ 186.400',
    hint: 'Estrutura preparada para consolidar o mês corrente e comparar com o anterior.',
    tone: 'dark',
  },
]



const PRODUCTS_ROWS = [
  {
    product: 'Banana Prata',
    pricePF: 'R$ 6,50',
    priceCNPJ: 'R$ 5,80',
    quantity: '3.250 Kg',
    status: 'Ativo',
  },
  {
    product: 'Abacaxi Pérola',
    pricePF: 'R$ 7,90',
    priceCNPJ: 'R$ 7,00',
    quantity: '780 Kg',
    status: 'Rascunho',
  },
  {
    product: 'Tomate Italiano',
    pricePF: 'R$ 8,20',
    priceCNPJ: 'R$ 7,40',
    quantity: '1.120 Kg',
    status: 'Ativo',
  },
  {
    product: 'Uva Vitória',
    pricePF: 'R$ 14,00',
    priceCNPJ: 'R$ 12,50',
    quantity: '240 Kg',
    status: 'Ativo',
  },
]

const DASHBOARD_SUMMARY = [
  { label: 'Volume vendido', value: '92.400 Kg', note: '+8,2% vs mês anterior' },
  { label: 'Ticket médio', value: 'R$ 418', note: '+4,1% no período' },
  { label: 'Margem estimada', value: '26%', note: 'Baseada em mix e custo médio' },
]

const STOCK_ROWS = [
  {
    product: 'Banana Prata',
    location: 'CD Principal',
    balance: '3.250 Kg',
    min: '1.000 Kg',
    status: 'Saudável',
  },
  {
    product: 'Abacaxi Pérola',
    location: 'Loja Centro',
    balance: '780 Kg',
    min: '900 Kg',
    status: 'Reposição',
  },
  {
    product: 'Tomate Italiano',
    location: 'CD Principal',
    balance: '1.120 Kg',
    min: '1.100 Kg',
    status: 'Atenção',
  },
  {
    product: 'Uva Vitória',
    location: 'Loja Norte',
    balance: '240 Bandejas',
    min: '180 Bandejas',
    status: 'Saudável',
  },
]




const API_BLUEPRINTS = {
  home: [
    'GET /api/menu/metrics',
    'GET /api/logs',
    'GET /api/home/revenue/monthly',
  ],
  products: [
    'GET /api/products',
    'POST /api/products',
    'PATCH /api/products/:id',
    'DELETE /api/products/:id',
  ],
  dashboard: [
    'GET /api/dashboard/overview',
    'GET /api/dashboard/revenue-trend',
    'GET /api/dashboard/top-categories',
  ],
  stock: [
    'GET /api/stock/summary',
    'GET /api/stock/movements',
    'POST /api/stock/entry',
    'POST /api/stock/output',
  ],
  employees: [
    'GET /api/employees',
    'GET /api/employees/permissions',
    'POST /api/employees',
    'PATCH /api/employees/:id/status',
  ],
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function extractApiMessage(data) {
  if (!data) return null
  if (typeof data === 'string') return data
  if (Array.isArray(data)) {
    const first = data.find((v) => typeof v === 'string')
    return first || null
  }
  if (typeof data === 'object') {
    const keys = ['message', 'msg', 'detail', 'error', 'description', 'title']
    for (const k of keys) {
      const v = data[k]
      if (typeof v === 'string' && v.trim()) return v
      if (Array.isArray(v)) {
        const first = v.find((x) => typeof x === 'string')
        if (first) return first
      }
      if (v && typeof v === 'object') {
        const nested = extractApiMessage(v)
        if (nested) return nested
      }
    }

    for (const v of Object.values(data)) {
      if (typeof v === 'string' && v.trim()) return v
    }
  }
  return null
}

function getTokenFromResponse(data) {
  if (!data || typeof data !== 'object') return null
  return data.access_token || data.token || data.accessToken || null
}

function getDisplayNameFromResponse(data, fallback = '') {
  if (!data || typeof data !== 'object') return fallback

  const candidates = [
    data.name,
    data.full_name,
    data.fullName,
    data.user,
    data.usuario,
    data.nome,
    data?.user?.name,
    data?.user?.full_name,
    data?.user?.fullName,
    data?.user?.usuario,
    data?.user?.nome,
    data?.profile?.name,
    data?.profile?.full_name,
    data?.profile?.fullName,
    data?.profile?.nome,
    data?.data?.name,
    data?.data?.full_name,
    data?.data?.fullName,
    data?.data?.nome,
    data.username,
    data?.user?.username,
    data?.profile?.username,
    data?.data?.username,
  ]

  const match = candidates.find((value) => typeof value === 'string' && value.trim())
  return match?.trim() || fallback
}

async function resolveDisplayName(fallback = 'Usuário do sistema') {
  try {
    const res = await api.get('/api/me')
    return getDisplayNameFromResponse(res?.data, fallback) || fallback
  } catch {
    return fallback
  }
}

function getRoleFromResponse(data) {
  if (!data || typeof data !== 'object') return ''
  const candidates = [
    data.role, data.cargo,
    data?.user?.role, data?.user?.cargo,
    data?.profile?.role, data?.profile?.cargo,
    data?.data?.role, data?.data?.cargo,
  ]
  const match = candidates.find((v) => typeof v === 'string' && v.trim())
  return match?.trim().toLowerCase() || ''
}

async function resolveUserInfo(fallbackName = 'Usuário do sistema') {
  try {
    const res = await api.get('/api/me')
    const name = getDisplayNameFromResponse(res?.data, fallbackName) || fallbackName
    const role = getRoleFromResponse(res?.data)
    return { name, role }
  } catch {
    return { name: fallbackName, role: (localStorage.getItem('user_role') || '').toLowerCase() }
  }
}

function getInitials(fullName = '') {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'US'
  if (parts.length === 1) return parts[0][0].toUpperCase()

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}




function formatKgValue(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '-- Kg'

  return `${numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} Kg`
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M4 4l16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('display_name') || 'Usuário do sistema')
  const [userRole, setUserRole] = useState(() => (localStorage.getItem('user_role') || '').toLowerCase())

  useEffect(() => {
    if (!token) return

    let ignore = false

    resolveUserInfo(localStorage.getItem('display_name') || 'Usuário do sistema').then(({ name, role }) => {
      if (ignore) return
      localStorage.setItem('display_name', name)
      localStorage.setItem('user_role', role.toLowerCase())
      setDisplayName(name)
      setUserRole(role.toLowerCase())
    })

    return () => {
      ignore = true
    }
  }, [token])

  if (token) {
    return (
      <MainLayout
        userName={displayName}
        userRole={userRole}
        onLogout={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('display_name')
          localStorage.removeItem('user_role')
          setToken(null)
          setDisplayName('Usuário do sistema')
          setUserRole('')
        }}
      />
    )
  }

  return (
    <LoginPage
      onAuthed={(nextToken, nextDisplayName, nextRole) => {
        setToken(nextToken)
        setDisplayName(nextDisplayName)
        setUserRole(nextRole || '')
      }}
    />
  )
}

function LoginPage({ onAuthed }) {
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  function notify(next) {
    setToast({ id: globalThis.crypto?.randomUUID?.() || String(Date.now()), ...next })
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (loading) return

    if (!user.trim() || !password) {
      notify({ type: 'error', title: 'Campos obrigatórios', message: 'Preencha usuário e senha.' })
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/login', {
        username: user,
        user,
        password,
      })

      const data = res?.data
      const accessToken = getTokenFromResponse(data)

      if (!accessToken) {
        notify({
          type: 'error',
          title: 'Login falhou',
          message: 'A API respondeu, mas não retornou access_token.',
        })
        return
      }

      localStorage.setItem('token', accessToken)

      const fallbackName = getDisplayNameFromResponse(data, user.trim()) || 'Usuário do sistema'
      const { name: displayName, role: userRole } = await resolveUserInfo(fallbackName)

      localStorage.setItem('display_name', displayName)
      localStorage.setItem('user_role', userRole.toLowerCase())
      notify({ type: 'success', title: 'Login realizado', message: `Bem-vindo, ${displayName}!` })
      onAuthed(accessToken, displayName, userRole)
    } catch (err) {
      const data = err?.response?.data
      const msg = extractApiMessage(data) || err?.message || 'Erro ao autenticar.'
      notify({ type: 'error', title: 'Erro no login', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="header">
        <img src={logo} alt="Logo Desfruta" />
      </header>

      <form onSubmit={handleLogin}>
        <div className="inputContainer">
          <label htmlFor="user">NAME</label>
          <input
            type="text"
            name="user"
            id="user"
            placeholder="Gabriel Ogura"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="inputContainer">
          <label htmlFor="password">PASSWORD</label>

          <div className="passwordWrap">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              placeholder="***********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button
              type="button"
              className="passwordToggle"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <button className="button" disabled={loading}>
          {loading ? (
            <span className="btnInner">
              <span className="spinner" aria-hidden="true" />
              Entrando...
            </span>
          ) : (
            'Login'
          )}
        </button>

        <div className="footer">
          <a href="#">Esqueceu a Senha?</a>
        </div>
      </form>
    </div>
  )
}

const EMPLOYEES_ROLES = ['gerente', 'desenvolvedor']

function MainLayout({ onLogout, userName, userRole }) {
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState('home')

  const canSeeEmployees = EMPLOYEES_ROLES.includes(userRole?.toLowerCase?.() || '')

  const visibleNav = useMemo(
    () => NAV.filter((item) => item.key !== 'employees' || canSeeEmployees),
    [canSeeEmployees]
  )

  // If active tab is hidden due to role, reset to home
  const safeActive = visibleNav.find((item) => item.key === active) ? active : 'home'

  return (
    <div className={cx('layout', collapsed && 'isCollapsed')}>
      <aside className={cx('sidebar', collapsed && 'collapsed')}>
        <div className="sidebarInner">
          <div className="brand">
            <div className="brandLogo">
              <img src={logo} alt="Desfruta" />
            </div>

            {!collapsed && (
              <div className="brandText">
                <div className="brandName">Desfruta</div>
              </div>
            )}

            <button
              className="collapseBtn"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              title={collapsed ? 'Expandir' : 'Recolher'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <div className="sidebarBody">
            <nav className="nav">
              {visibleNav.map((item) => {
                const Icon = item.icon
                const isActive = item.key === safeActive

                return (
                  <button
                    key={item.key}
                    className={cx('navItem', isActive && 'active')}
                    onClick={() => setActive(item.key)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="navIcon">
                      <Icon size={18} />
                    </span>
                    {!collapsed && <span className="navLabel">{item.label}</span>}
                    {!collapsed && isActive && <span className="activeDot" />}
                  </button>
                )
              })}
            </nav>

            <div className="sidebarFooter">
              <button className="logoutBtn" onClick={onLogout} aria-label="Sair" title="Sair">
                <LogOut size={18} />
                {!collapsed && <span>Sair</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <PageContent activeKey={safeActive} userName={userName} userRole={userRole} />
      </main>
    </div>
  )
}

function PageContent({ activeKey, userName, userRole }) {
  const current = useMemo(() => NAV.find((item) => item.key === activeKey) ?? NAV[0], [activeKey])
  const userInitials = getInitials(userName)

  return (
    <div className="content">
      <div className="contentHeader">
        <div>
          <h1 className="h1">{current.label}</h1>
          <p className="muted">{current.description}</p>
        </div>

        <div className="topActions">
          <div className="avatar" title={userName || 'Usuário'} aria-label={`Avatar de ${userName || 'usuário'}`}>
            <span>{userInitials}</span>
          </div>
        </div>
      </div>

      {activeKey === 'home' && <HomePage />}
      {activeKey === 'products' && <ProductsPage />}
      {activeKey === 'dashboard' && <DashboardPage />}
      {activeKey === 'stock' && <StockPage />}
      {activeKey === 'employees' && <EmployeesPage />}
    </div>
  )
}

function HomePage() {
  const [metrics, setMetrics] = useState({ loading: true, error: '', totalKg: 0, disponiveis: 0, total: 0 })

  useEffect(() => {
    let ignore = false

    async function loadMetrics() {
      try {
        const res = await api.get('/api/menu/metrics')
        if (ignore) return
        const data        = res?.data ?? {}
        const quantidade  = data?.quantidade ?? {}
        setMetrics({
          loading:     false,
          error:       '',
          totalKg:     Number(data?.kg_disponiveis ?? 0),
          disponiveis: Number(quantidade?.disponiveis ?? 0),
          total:       Number(quantidade?.total ?? 0),
        })
      } catch (err) {
        if (ignore) return
        setMetrics({
          loading: false,
          error: extractApiMessage(err?.response?.data) || 'Não foi possível carregar os indicadores.',
          totalKg: 0, disponiveis: 0, total: 0,
        })
      }
    }

    loadMetrics()
    return () => { ignore = true }
  }, [])

  const homeMetrics = useMemo(() => {
    return HOME_METRICS.map((item) => {
      if (item.key === 'totalKg') {
        if (metrics.loading) return { ...item, value: 'Carregando...', hint: 'Consultando /api/menu/metrics.' }
        if (metrics.error)   return { ...item, value: '--', hint: metrics.error }
        return { ...item, value: formatKgValue(metrics.totalKg), hint: 'Total de Kg disponível retornado pela API.' }
      }
      if (item.key === 'availability') {
        if (metrics.loading) return { ...item, value: 'Carregando...', hint: 'Consultando /api/menu/metrics.' }
        if (metrics.error)   return { ...item, value: '--', hint: metrics.error }
        return { ...item, value: `${metrics.disponiveis}/${metrics.total}`, hint: 'Variações disponíveis em relação ao total cadastrado.' }
      }
      return item
    })
  }, [metrics])

  return (
    <div className="pageStack">
      <section className="heroCard">
        <div>
          <span className="eyebrow">Painel principal</span>
          <h2 className="heroTitle">Gestão de estoque, produtos e operação em tempo real.</h2>
          <p className="heroText">
            Acompanhe o total de Kg disponível, variações ativas e faturamento mensal
            diretamente dos dados do banco.
          </p>
        </div>

        <div className="heroBadges">
          <span className="softBadge">Estoque</span>
          <span className="softBadge">Produtos</span>
          <span className="softBadge">Operação</span>
        </div>
      </section>

      <div className="metricGrid">
        {homeMetrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <RecentActivityTable />
    </div>
  )
}

function normalizeTableRows(data) {
  if (!Array.isArray(data)) return []
  return data.map((item) => ({
    product: item.sabor ?? item.product ?? item.nome ?? '',
    pricePF: item.preco_pf != null ? `R$ ${Number(item.preco_pf).toFixed(2).replace('.', ',')}` : item.pricePF ?? '--',
    priceCNPJ: item.preco_cnpj != null ? `R$ ${Number(item.preco_cnpj).toFixed(2).replace('.', ',')}` : item.priceCNPJ ?? '--',
    quantity: item.quantidade_kg != null ? `${item.quantidade_kg} Kg` : item.quantity ?? '--',
    status: item.disponivel === true || item.disponivel === 1 ? 'Ativo' : item.disponivel === false || item.disponivel === 0 ? 'Inativo' : item.status ?? '--',
    _sabor: item.sabor ?? item.product ?? item.nome ?? '',
  }))
}

function parseCurrencyInput(value) {
  if (!value) return null
  const cleaned = String(value).replace(/[R$\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : null
}

function ProductCadastrarModal({ form, onConfirm, onCancel, submitting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 440,
        boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
        animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={20} style={{ color: '#059669' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Confirmar cadastro</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', marginTop: 2 }}>Revise os dados antes de registrar</p>
          </div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Nome', value: form.nome },
            { label: 'Status', value: form.status },
            { label: 'Preço PF', value: form.precoPF ? `R$ ${form.precoPF}` : '—' },
            { label: 'Preço CNPJ', value: form.precoCNPJ ? `R$ ${form.precoCNPJ}` : '—' },
            { label: 'Quantidade (Kg)', value: form.quantidade ? `${form.quantidade} Kg` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value || '—'}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={submitting} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13.5, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={submitting} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: submitting ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(16,185,129,0.25)', transition: 'all 0.15s' }}>
            {submitting ? <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Cadastrando...</> : <><Package size={15} /> Confirmar cadastro</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  )
}

function ProductDeletarModal({ nome, onConfirm, onCancel, deleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 420,
        boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
        animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Confirmar exclusão</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', marginTop: 2 }}>Esta ação não pode ser desfeita</p>
          </div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: 13.5, color: '#7f1d1d', lineHeight: 1.6 }}>
            Tem certeza que deseja deletar o produto <strong style={{ color: '#991b1b' }}>{nome}</strong>?
            <br /><span style={{ fontSize: 12, color: '#b91c1c', opacity: 0.85 }}>O registro será removido permanentemente do sistema.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={deleting} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13.5, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: deleting ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(239,68,68,0.25)', transition: 'all 0.15s' }}>
            {deleting ? <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Deletando...</> : <><Trash2 size={15} /> Sim, deletar</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  )
}

function ProductsPage() {
  const [rows, setRows] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const [metrics, setMetrics] = useState({ loading: true, error: false, total: null, disponiveis: null, porcentagem: null })
  const [showCadastrarConfirm, setShowCadastrarConfirm] = useState(false)
  const [showDeletarConfirm, setShowDeletarConfirm] = useState(false)

  function notify(next) {
    setToast({ id: globalThis.crypto?.randomUUID?.() || String(Date.now()), ...next })
  }

  async function loadTable(ignore) {
    setTableLoading(true)
    try {
      const res = await api.get('/api/produtos/tabela')
      if (ignore?.current) return
      const data = res?.data?.dados ?? res?.data?.data ?? res?.data ?? []
      setRows(normalizeTableRows(data))
    } catch {
      if (ignore?.current) return
      setRows(normalizeTableRows())
    } finally {
      if (!ignore?.current) setTableLoading(false)
    }
  }

  async function loadMetrics(ignore) {
    try {
      const res = await api.get('/api/produtos/metricas')
      if (ignore?.current) return
      const data = res?.data ?? {}
      setMetrics({
        loading: false, error: false,
        total: data.total ?? null,
        disponiveis: data.disponiveis ?? null,
        porcentagem: data.porcentagem ?? null,
      })
    } catch {
      if (ignore?.current) return
      setMetrics({ loading: false, error: true, total: null, disponiveis: null, porcentagem: null })
    }
  }

  useEffect(() => {
    const ignore = { current: false }
    loadTable(ignore)
    loadMetrics(ignore)
    return () => { ignore.current = true }
  }, [])

  const [form, setForm] = useState({ nome: '', status: 'Ativo', precoPF: '', precoCNPJ: '', quantidade: '' })

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleClear() {
    setForm({ nome: '', status: 'Ativo', precoPF: '', precoCNPJ: '', quantidade: '' })
  }

  function handleCadastrarClick() {
    const sabor = form.nome.trim()
    const preco_pf = parseCurrencyInput(form.precoPF)
    const preco_cnpj = parseCurrencyInput(form.precoCNPJ)
    const quantidade_kg = parseCurrencyInput(form.quantidade)
    if (!sabor) { notify({ type: 'error', title: 'Campo obrigatório', message: 'Informe o nome do produto.' }); return }
    if (preco_pf === null) { notify({ type: 'error', title: 'Campo inválido', message: 'Informe um Preço PF válido (ex: 6,50).' }); return }
    if (preco_cnpj === null) { notify({ type: 'error', title: 'Campo inválido', message: 'Informe um Preço CNPJ válido (ex: 5,80).' }); return }
    if (quantidade_kg === null) { notify({ type: 'error', title: 'Campo inválido', message: 'Informe a Quantidade em Kg válida (ex: 18,70).' }); return }
    setShowCadastrarConfirm(true)
  }

  async function handleConfirmCadastrar() {
    if (submitting) return
    const sabor = form.nome.trim()
    const preco_pf = parseCurrencyInput(form.precoPF)
    const preco_cnpj = parseCurrencyInput(form.precoCNPJ)
    const quantidade_kg = parseCurrencyInput(form.quantidade)
    const disponivel = form.status === 'Ativo'
    setSubmitting(true)
    try {
      await api.post('/api/produtos/cadastrar', { sabor, preco_pf, preco_cnpj, quantidade_kg, disponivel })
      notify({ type: 'success', title: 'Produto cadastrado', message: `${sabor} foi cadastrado com sucesso.` })
      handleClear()
      setShowCadastrarConfirm(false)
      await loadTable({ current: false })
      await loadMetrics({ current: false })
    } catch (err) {
      const msg = extractApiMessage(err?.response?.data) || err?.message || 'Erro ao cadastrar produto.'
      notify({ type: 'error', title: 'Erro ao cadastrar', message: msg })
      setShowCadastrarConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeletarClick() {
    const sabor = form.nome.trim()
    if (!sabor) { notify({ type: 'error', title: 'Campo obrigatório', message: 'Informe o nome do produto a ser deletado.' }); return }
    setShowDeletarConfirm(true)
  }

  async function handleConfirmDeletar() {
    if (deleting) return
    const sabor = form.nome.trim()
    setDeleting(true)
    setDeletingId(sabor)
    try {
      await api.delete('/api/produtos/deletar', { data: { sabor } })
      notify({ type: 'success', title: 'Produto removido', message: `${sabor} foi deletado com sucesso.` })
      handleClear()
      setShowDeletarConfirm(false)
      await loadTable({ current: false })
      await loadMetrics({ current: false })
    } catch (err) {
      const msg = extractApiMessage(err?.response?.data) || err?.message || 'Erro ao deletar produto.'
      notify({ type: 'error', title: 'Erro ao deletar', message: msg })
      setShowDeletarConfirm(false)
    } finally {
      setDeleting(false)
      setDeletingId(null)
    }
  }

  async function handleDelete(row) {
    const sabor = row._sabor || row.product
    if (!sabor) return
    setDeletingId(sabor)
    try {
      await api.delete('/api/produtos/deletar', { data: { sabor } })
      notify({ type: 'success', title: 'Produto removido', message: `${sabor} foi deletado com sucesso.` })
      await loadTable({ current: false })
      await loadMetrics({ current: false })
    } catch (err) {
      const msg = extractApiMessage(err?.response?.data) || err?.message || 'Erro ao deletar produto.'
      notify({ type: 'error', title: 'Erro ao deletar', message: msg })
    } finally {
      setDeletingId(null)
    }
  }

  const metricTotal = metrics.loading ? 'Carregando...' : metrics.error ? '--' : String(metrics.total ?? '--')
  const metricAtivos = metrics.loading ? 'Carregando...' : metrics.error ? '--' : String(metrics.disponiveis ?? '--')
  const metricPorcentagem = metrics.loading ? 'Carregando...' : metrics.error ? '--' : metrics.porcentagem != null ? `${metrics.porcentagem}%` : '--'
  const isDeleting = deletingId !== null

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {showCadastrarConfirm && (
        <ProductCadastrarModal
          form={form}
          submitting={submitting}
          onConfirm={handleConfirmCadastrar}
          onCancel={() => setShowCadastrarConfirm(false)}
        />
      )}

      {showDeletarConfirm && (
        <ProductDeletarModal
          nome={form.nome.trim()}
          deleting={deleting}
          onConfirm={handleConfirmDeletar}
          onCancel={() => setShowDeletarConfirm(false)}
        />
      )}

      <div className="metricGrid compactMetrics">
        <MiniMetric title="Produtos cadastrados"    value={metricTotal}      detail="Total de produtos no sistema" />
        <MiniMetric title="Produtos Ativos"          value={metricAtivos}     detail="Produtos disponíveis para venda" />
        <MiniMetric title="Taxa de produtos ativos"  value={metricPorcentagem} detail="Percentual de produtos ativos" />
      </div>

      <SectionCard title="Cadastro Rápido" subtitle="Cadastro completo do produto, contendo todos os campos necessários.">
        <div className="filtersGrid">
          <Field label="Nome do Produto" placeholder="Nome do produto" value={form.nome} onChange={(v) => handleFormChange('nome', v)} />
          <SelectField label="Status" value={form.status} onChange={(v) => handleFormChange('status', v)} options={['Ativo', 'Inativo']} placeholder={false} />
          <Field label="Preço PF" placeholder="6,50" type="text" value={form.precoPF} onChange={(v) => handleFormChange('precoPF', v)} />
          <Field label="Preço CNPJ" placeholder="5,80" type="text" value={form.precoCNPJ} onChange={(v) => handleFormChange('precoCNPJ', v)} />
          <Field label="Quantidade (Kg)" placeholder="18,70" type="text" value={form.quantidade} onChange={(v) => handleFormChange('quantidade', v)} />
        </div>

        <div className="sectionActions">
          <button className="btn" onClick={handleCadastrarClick} disabled={submitting || isDeleting || deleting}>
            <Plus size={15} />
            {submitting ? 'Cadastrando...' : 'Novo produto'}
          </button>
          <button className="dangerBtn" onClick={handleDeletarClick} disabled={isDeleting || submitting || deleting}>
            <Trash2 size={15} />
            {deleting ? 'Deletando...' : 'Deletar produto'}
          </button>
          <button className="ghostBtn" onClick={handleClear} disabled={submitting || isDeleting || deleting}>
            <X size={15} />
            Limpar campos
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Tabela base de produtos" subtitle="Clique no ícone de lixeira para deletar um produto diretamente pela tabela.">
        <div className="table modernTable productsTable">
          <div className="row head" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
            <span>Produto</span>
            <span>Preço PF</span>
            <span>Preço CNPJ</span>
            <span>Quantidade (Kg)</span>
            <span>Status</span>
          </div>

          {tableLoading ? (
            <div className="row" style={{ justifyContent: 'center', padding: '1.5rem', color: 'var(--text-muted, #888)' }}>
              Carregando produtos...
            </div>
          ) : rows.length === 0 ? (
            <div className="row" style={{ justifyContent: 'center', padding: '1.5rem', color: 'var(--text-muted, #888)' }}>
              Nenhum produto cadastrado.
            </div>
          ) : (
            rows.map((row) => (
              <div
                className="row"
                key={row._sabor || row.product}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', alignItems: 'center' }}
              >
                <span>{row.product}</span>
                <span>{row.pricePF}</span>
                <span>{row.priceCNPJ}</span>
                <span>{row.quantity}</span>
                <span>
                  <span className={cx('pill', row.status === 'Ativo' ? 'ok' : 'mid')}>{row.status}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </>
  )
}

function DashboardPage() {
  return (
    <div className="pageStack">
      <div className="metricGrid compactMetrics">
        {DASHBOARD_SUMMARY.map((item) => (
          <MiniMetric key={item.label} title={item.label} value={item.value} detail={item.note} />
        ))}
      </div>

      <div className="splitGrid twoColsTop">
        <SectionCard title="Área reservada para gráficos" subtitle="Blocos prontos para conectar bibliotecas como Recharts ou ApexCharts.">
          <div className="chartPlaceholder tall">
            <div className="chartBars">
              <span style={{ height: '42%' }} />
              <span style={{ height: '65%' }} />
              <span style={{ height: '58%' }} />
              <span style={{ height: '84%' }} />
              <span style={{ height: '76%' }} />
              <span style={{ height: '92%' }} />
              <span style={{ height: '70%' }} />
            </div>
            <div className="chartLegend">
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
              <span>Jul</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="KPIs comparativos" subtitle="Bom para ranking, mix por categoria e metas mensais.">
          <div className="summaryList">
            <div className="summaryItem">
              <span>Meta do mês</span>
              <strong>82%</strong>
            </div>
            <div className="summaryItem">
              <span>Categoria líder</span>
              <strong>Frutas frescas</strong>
            </div>
            <div className="summaryItem">
              <span>Melhor unidade</span>
              <strong>CD Principal</strong>
            </div>
            <div className="summaryItem">
              <span>Pior ruptura</span>
              <strong>Loja Norte</strong>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function normalizeStockRows(data) {
  if (!Array.isArray(data)) return []
  return data.map((item) => ({
    product:   item.sabor ?? item.produto ?? item.product ?? item.nome ?? '—',
    validade:  item.validade ?? item.data_validade ?? item.expiry ?? null,
    precoPF:   item.preco_pf   != null ? `R$ ${Number(item.preco_pf).toFixed(2).replace('.', ',')}` : null,
    precoCNPJ: item.preco_cnpj != null ? `R$ ${Number(item.preco_cnpj).toFixed(2).replace('.', ',')}` : null,
    quantity:  item.quantidade_kg != null ? `${item.quantidade_kg} Kg` : item.quantity ?? null,
    status:    item.disponivel === true  || item.disponivel === 1 ? 'Disponível'
             : item.disponivel === false || item.disponivel === 0 ? 'Indisponível'
             : item.status ?? null,
  }))
}

function formatValidade(v) {
  if (!v) return '--'
  const d = new Date(v)
  if (isNaN(d)) return v
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StockPage() {
  const [rows, setRows] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [tableError, setTableError] = useState(false)
  const [metrics, setMetrics] = useState({ loading: true, error: false, saldo: null, entradas: null, saidas: null })
  const [stockForm, setStockForm] = useState({ produto: '', validade: '', quantidade: '', acao: 'Adicionar' })
  const [productOptions, setProductOptions] = useState([])

  function handleStockFormChange(field, value) {
    setStockForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleStockClear() {
    setStockForm({ produto: '', validade: '', quantidade: '', acao: 'Adicionar' })
  }

  function handleStockSalvar() {
    // TODO: integrar com POST /api/estoque/movimentacao
  }

  async function loadTable(ignore) {
    setTableLoading(true)
    setTableError(false)
    try {
      const res = await api.get('/api/estoque/tabela')
      if (ignore?.current) return
      const data = res?.data?.dados ?? res?.data?.data ?? res?.data ?? []
      setRows(normalizeStockRows(Array.isArray(data) ? data : []))
    } catch {
      if (ignore?.current) return
      setTableError(true)
      setRows([])
    } finally {
      if (!ignore?.current) setTableLoading(false)
    }
  }

  async function loadMetrics(ignore) {
    try {
      const res = await api.get('/api/estoque/metricas')
      if (ignore?.current) return
      const data = res?.data ?? {}
      setMetrics({
        loading:  false,
        error:    false,
        saldo:    data.saldo_total    ?? data.saldo    ?? null,
        entradas: data.entradas_hoje  ?? data.entradas ?? null,
        saidas:   data.saidas_hoje    ?? data.saidas   ?? null,
      })
    } catch {
      if (ignore?.current) return
      setMetrics({ loading: false, error: true, saldo: null, entradas: null, saidas: null })
    }
  }

  useEffect(() => {
    const ignore = { current: false }
    loadTable(ignore)
    loadMetrics(ignore)
    return () => { ignore.current = true }
  }, [])

  function fmtKg(v) {
    if (v == null) return '--'
    const n = Number(v)
    return Number.isFinite(n) ? `${n.toLocaleString('pt-BR')} Kg` : String(v)
  }

  const mVal = (raw) => metrics.loading ? 'Carregando...' : metrics.error ? '--' : fmtKg(raw)

  return (
    <div className="pageStack">
      <div className="metricGrid compactMetrics">
        <MiniMetric title="Saldo total"    value={mVal(metrics.saldo)}    detail="Consolidado do estoque atual" />
        <MiniMetric title="Entradas hoje"  value={mVal(metrics.entradas)} detail="Movimentação recebida no dia" />
        <MiniMetric title="Saídas hoje"    value={mVal(metrics.saidas)}   detail="Pedidos e baixas operacionais" />
      </div>

      <SectionCard title="Registrar Movimentação" subtitle="Selecione o produto, informe a validade, quantidade e o tipo de ação a ser registrada.">
        <div className="filtersGrid">
          <label className="field">
            <span>Produto</span>
            <select
              value={stockForm.produto}
              onChange={(e) => handleStockFormChange('produto', e.target.value)}
            >
              <option value="" disabled>Selecionar produto...</option>
              {productOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              {productOptions.length === 0 && (
                <option disabled>Nenhum produto disponível</option>
              )}
            </select>
          </label>

          <label className="field">
            <span>Validade</span>
            <input
              type="date"
              value={stockForm.validade}
              onChange={(e) => handleStockFormChange('validade', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Quantidade (Kg)</span>
            <input
              type="text"
              placeholder="Ex: 50,00"
              value={stockForm.quantidade}
              onChange={(e) => handleStockFormChange('quantidade', e.target.value)}
            />
          </label>

          <SelectField
            label="Ação"
            value={stockForm.acao}
            onChange={(v) => handleStockFormChange('acao', v)}
            options={['Adicionar', 'Retirar', 'Venda', 'Vencido']}
            placeholder={false}
          />
        </div>

        <div className="sectionActions">
          <button className="btn" onClick={handleStockSalvar}>
            <Plus size={15} />
            Salvar Alterações
          </button>
          <button className="ghostBtn" onClick={handleStockClear}>
            <X size={15} />
            Limpar Campos
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Tabela de Estoque" subtitle="Visualização completa dos produtos em estoque, preços e disponibilidade.">
        <div className="table modernTable stockTable">
          <div className="row head rowStock">
            <span>Produto</span>
            <span>Validade</span>
            <span>Preço PF</span>
            <span>Preço CNPJ</span>
            <span>Quantidade (Kg)</span>
            <span>Status</span>
          </div>

          {tableLoading && (
            <div className="row rowStock">
              <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Carregando estoque...</span>
            </div>
          )}

          {!tableLoading && tableError && (
            <div className="row rowStock">
              <span style={{ gridColumn: '1 / -1', color: 'var(--red, #e55)', padding: '4px 0' }}>
                Não foi possível carregar os dados do estoque.
              </span>
            </div>
          )}

          {!tableLoading && !tableError && rows.length === 0 && (
            <div className="row rowStock">
              <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Nenhum produto no estoque.</span>
            </div>
          )}

          {!tableLoading && !tableError && rows.map((row) => (
            <div className="row rowStock" key={row.product}>
              <span>{row.product}</span>
              <span>{formatValidade(row.validade)}</span>
              <span>{row.precoPF   ?? '--'}</span>
              <span>{row.precoCNPJ ?? '--'}</span>
              <span>{row.quantity  ?? '--'}</span>
              <span>
                <span className={cx('pill', row.status === 'Disponível' ? 'ok' : row.status === 'Indisponível' ? 'bad' : row.status ? 'mid' : '')}>
                  {row.status ?? '--'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function PasswordField({ label, placeholder, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <label className="field">
      <span>{label}</span>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: '#94a3b8', display: 'flex', alignItems: 'center',
          }}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </label>
  )
}

function EmployeeDeleteModal({ username, deleting, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 18,
        padding: '2rem',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
        animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Trash2 size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Confirmar exclusão
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
              Esta ação não pode ser desfeita
            </p>
          </div>
        </div>

        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{ margin: 0, fontSize: 13.5, color: '#7f1d1d', lineHeight: 1.6 }}>
            Tem certeza que deseja deletar o funcionário{' '}
            <strong style={{ color: '#991b1b' }}>@{username}</strong>?
            <br />
            <span style={{ fontSize: 12, color: '#b91c1c', opacity: 0.85 }}>
              O registro será removido permanentemente do sistema.
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b',
              fontSize: 13.5, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: deleting ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg, #f87171, #ef4444)',
              color: '#fff', fontSize: 13.5, fontWeight: 700,
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
              transition: 'all 0.15s',
            }}
          >
            {deleting ? (
              <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Deletando...</>
            ) : (
              <><Trash2 size={15} /> Sim, deletar</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

function EmployeeConfirmModal({ form, onConfirm, onCancel, submitting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 18,
        padding: '2rem',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
        animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Users size={20} style={{ color: '#059669' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Confirmar cadastro
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
              Revise os dados antes de registrar
            </p>
          </div>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {[
            { label: 'Nome', value: form.nome },
            { label: 'Usuário', value: form.username },
            { label: 'Senha', value: '••••••••' },
            { label: 'Cargo', value: form.role },
            { label: 'Empresa', value: form.empresa },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value || '—'}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b',
              fontSize: 13.5, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: submitting ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', fontSize: 13.5, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              transition: 'all 0.15s',
            }}
          >
            {submitting ? (
              <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Registrando...</>
            ) : (
              <><Users size={15} /> Confirmar cadastro</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

function EmployeesPage() {
  const [metrics, setMetrics] = useState({ loading: true, error: false, total: null, ativos: null, cargos: null })
  const [rows, setRows] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ nome: '', username: '', password: '', role: 'Funcionário', empresa: 'Desfruta Polpas' })
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function notify(next) {
    setToast({ id: globalThis.crypto?.randomUUID?.() || String(Date.now()), ...next })
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleClear() {
    setForm({ nome: '', username: '', password: '', role: 'Funcionário', empresa: 'Desfruta Polpas' })
  }

  function handleCadastrarClick() {
    const { nome, username, password, role, empresa } = form
    if (!nome.trim() || !username.trim() || !password.trim() || !role.trim() || !empresa.trim()) {
      notify({ type: 'error', title: 'Campos obrigatórios', message: 'Preencha todos os campos antes de cadastrar.' })
      return
    }
    setShowConfirm(true)
  }

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    try {
      await api.post('/api/funcionarios/cadastrar', {
        nome: form.nome.trim(),
        username: form.username.trim(),
        password: form.password,
        role: form.role.trim(),
        empresa: form.empresa.trim(),
      })
      notify({ type: 'success', title: 'Funcionário cadastrado', message: `${form.nome.trim()} foi registrado com sucesso.` })
      handleClear()
      setShowConfirm(false)
      await reloadTabela()
      await reloadMetrics()
    } catch (err) {
      const msg = extractApiMessage(err?.response?.data) || err?.message || 'Erro ao cadastrar funcionário.'
      notify({ type: 'error', title: 'Erro ao cadastrar', message: msg })
      setShowConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeletarClick() {
    const { username } = form
    if (!username.trim()) {
      notify({ type: 'error', title: 'Campo obrigatório', message: 'Preencha o campo Usuário para deletar.' })
      return
    }
    setShowDeleteConfirm(true)
  }

  async function handleConfirmDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await api.delete('/api/funcionarios/deletar', {
        data: {
          username: form.username.trim(),
          password: form.password || undefined,
        },
      })
      notify({ type: 'success', title: 'Funcionário deletado', message: `${form.username.trim()} foi removido com sucesso.` })
      handleClear()
      setShowDeleteConfirm(false)
      await reloadTabela()
      await reloadMetrics()
    } catch (err) {
      const msg = extractApiMessage(err?.response?.data) || err?.message || 'Erro ao deletar funcionário.'
      notify({ type: 'error', title: 'Erro ao deletar', message: msg })
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  async function reloadMetrics() {
    try {
      const res = await api.get('/api/funcionarios/metricas')
      const data = res?.data ?? {}
      setMetrics({
        loading: false, error: false,
        total:  data.total_funcionarios ?? null,
        ativos: data.funcionarios_ativos ?? null,
        cargos: data.total_cargos ?? null,
      })
    } catch {
      setMetrics({ loading: false, error: true, total: null, ativos: null, cargos: null })
    }
  }

  async function reloadTabela() {
    try {
      const res = await api.get('/api/funcionarios/tabela')
      setRows(Array.isArray(res?.data?.dados) ? res.data.dados : [])
    } catch {
      setRows([])
    } finally {
      setTableLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadMetrics() {
      try {
        const res = await api.get('/api/funcionarios/metricas')
        if (ignore) return
        const data = res?.data ?? {}
        setMetrics({
          loading: false, error: false,
          total:  data.total_funcionarios ?? null,
          ativos: data.funcionarios_ativos ?? null,
          cargos: data.total_cargos ?? null,
        })
      } catch {
        if (ignore) return
        setMetrics({ loading: false, error: true, total: null, ativos: null, cargos: null })
      }
    }

    async function loadTabela() {
      try {
        const res = await api.get('/api/funcionarios/tabela')
        if (ignore) return
        setRows(Array.isArray(res?.data?.dados) ? res.data.dados : [])
      } catch {
        if (ignore) return
        setRows([])
      } finally {
        if (!ignore) setTableLoading(false)
      }
    }

    loadMetrics()
    loadTabela()
    return () => { ignore = true }
  }, [])

  function isAtivo(ultimoAcesso) {
    if (!ultimoAcesso) return false
    const ultimo = new Date(ultimoAcesso)
    if (isNaN(ultimo)) return false
    const diffHoras = (Date.now() - ultimo.getTime()) / (1000 * 60 * 60)
    return diffHoras < 24
  }

  function formatAcesso(ultimoAcesso) {
    if (!ultimoAcesso) return '—'
    const d = new Date(ultimoAcesso)
    if (isNaN(d)) return ultimoAcesso
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const val = (v) => metrics.loading ? 'Carregando...' : metrics.error ? '--' : String(v ?? '--')

  return (
    <div className="pageStack">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {showConfirm && (
        <EmployeeConfirmModal
          form={form}
          submitting={submitting}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <EmployeeDeleteModal
          username={form.username}
          deleting={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className="metricGrid compactMetrics">
        <MiniMetric title="Funcionários Cadastrados" value={val(metrics.total)}  detail="Total de funcionários no sistema" />
        <MiniMetric title="Funcionários Ativos"      value={val(metrics.ativos)} detail="Com acesso nas últimas 24h" />
        <MiniMetric title="Quantidade de Cargos"     value={val(metrics.cargos)} detail="Cargos distintos cadastrados" />
      </div>

      <SectionCard title="Cadastro de funcionário" subtitle="Preencha os campos para registrar um novo funcionário no sistema.">
        <div className="filtersGrid">
          <Field label="Nome"    placeholder="Nome completo"   value={form.nome}     onChange={(v) => handleFormChange('nome', v)} />
          <Field label="Usuário" placeholder="Nome de usuário" value={form.username} onChange={(v) => handleFormChange('username', v)} />
          <PasswordField label="Senha" placeholder="Senha de acesso" value={form.password} onChange={(v) => handleFormChange('password', v)} />
          <SelectField label="Cargo" value={form.role} onChange={(v) => handleFormChange('role', v)} options={['Funcionário', 'Gerente']} placeholder={false} />
          <SelectField label="Empresa" value={form.empresa} onChange={(v) => handleFormChange('empresa', v)} options={['Desfruta Polpas']} placeholder={false} />
        </div>

        <div className="sectionActions">
          <button className="btn" onClick={handleCadastrarClick} disabled={submitting || deleting}>
            <Plus size={15} />
            Cadastrar funcionário
          </button>
          <button className="dangerBtn" onClick={handleDeletarClick} disabled={submitting || deleting}>
            <Trash2 size={15} />
            {deleting ? 'Deletando...' : 'Deletar funcionário'}
          </button>
          <button className="ghostBtn" onClick={handleClear} disabled={submitting || deleting}>
            <X size={15} />
            Limpar campos
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Tabela de Funcionários" subtitle="Visualização completa dos funcionários cadastrados na plataforma.">
        <div className="table modernTable employeesTable">
          <div className="row head rowEmployees">
            <span>Nome</span>
            <span>Usuário</span>
            <span>Empresa</span>
            <span>Cargo</span>
            <span>Último Acesso</span>
            <span>Status</span>
          </div>

          {tableLoading && (
            <div className="row rowEmployees">
              <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Carregando...</span>
            </div>
          )}

          {!tableLoading && rows.length === 0 && (
            <div className="row rowEmployees">
              <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Nenhum dado disponível.</span>
            </div>
          )}

          {!tableLoading && rows.map((row, idx) => {
            const ativo = isAtivo(row.ultimo_acesso)
            return (
              <div className="row rowEmployees" key={idx}>
                <span>{row.nome ?? '—'}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>@{row.username ?? '—'}</span>
                <span>{row.empresa ?? '—'}</span>
                <span>{row.role ?? '—'}</span>
                <span>{formatAcesso(row.ultimo_acesso)}</span>
                <span>
                  <span className={cx('pill', ativo ? 'ok' : 'bad')}>
                    {ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

function detectLogType(acao) {
  if (!acao) return 'neutral'
  const s = acao.toLowerCase()
  if (
    s.includes('delet') || s.includes('remov') || s.includes('exclu') ||
    s.includes('cancel') || s.includes('inativ')
  ) return 'delete'
  if (
    s.includes('adicion') || s.includes('cadastr') || s.includes('cri') ||
    s.includes('insert') || s.includes('novo') || s.includes('nova') ||
    s.includes('entrada')
  ) return 'add'
  if (
    s.includes('atualiz') || s.includes('edit') || s.includes('alter') ||
    s.includes('modif') || s.includes('ajust') || s.includes('atuali')
  ) return 'edit'
  return 'neutral'
}

const LOG_BADGE = {
  add:     { label: 'Adicionado', bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  delete:  { label: 'Deletado',   bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  edit:    { label: 'Editado',    bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  neutral: { label: 'Ação',       bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
}

function LogBadge({ acao }) {
  const type = detectLogType(acao)
  const { label, bg, color, dot } = LOG_BADGE[type]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: dot,
        flexShrink: 0,
      }} />
      {label}
    </span>
  )
}

function RecentActivityTable() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get('/api/logs')
      .then((res) => {
        const dados = res.data?.dados
        setLogs(Array.isArray(dados) ? dados : [])
      })
      .catch(() => {
        setError('Não foi possível carregar os logs.')
        setLogs([])
      })
      .finally(() => setLoading(false))
  }, [])

  function formatTimestamp(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    if (isNaN(d)) return ts
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <SectionCard title="Atividade recente" subtitle="Logs de ações dos usuários carregados da API.">
      <div className="table modernTable activityTable">
        <div className="row head rowActivity">
          <span>Data</span>
          <span>Usuário</span>
          <span>Ação</span>
        </div>

        {loading && (
          <div className="row rowActivity">
            <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Carregando...</span>
          </div>
        )}

        {!loading && error && (
          <div className="row rowActivity">
            <span style={{ gridColumn: '1 / -1', color: 'var(--red, #e55)' }}>{error}</span>
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="row rowActivity">
            <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Nenhum dado disponível.</span>
          </div>
        )}

        {!loading &&
          !error &&
          logs.map((item, idx) => (
            <div className="row rowActivity" key={idx}>
              <span>{formatTimestamp(item.timestamp)}</span>
              <span>{item.nome_usuario ?? '—'}</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.acao ?? '—'}
                </span>
                <LogBadge acao={item.acao} />
              </span>
            </div>
          ))}
      </div>
    </SectionCard>
  )
}

function MetricCard({ label, value, hint, tone = 'green' }) {
  return (
    <article className={cx('metricCard', `tone-${tone}`)}>
      <span className="metricLabel">{label}</span>
      <strong className="metricValue">{value}</strong>
      <p className="metricHint">{hint}</p>
    </article>
  )
}

function MiniMetric({ title, value, detail }) {
  return (
    <article className="miniMetric">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="panel sectionCard">
      <div className="panelHeader innerGap">
        <div>
          <h2 className="h2">{title}</h2>
          {subtitle ? <p className="sectionSubtitle">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}


function Field({ label, placeholder, type = 'text', value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options = [], placeholder = true }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      >
        {placeholder && <option value="" disabled>Selecionar...</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  )
}
