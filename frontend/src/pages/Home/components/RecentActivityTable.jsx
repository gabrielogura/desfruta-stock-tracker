import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import api from '../../../api/axiosInstance'
import { SectionCard } from '../../../components/Cards'
import { LogBadge } from './LogBadge'

const FILTERS = [
  { label: 'Hoje',    days: 1  },
  { label: '7 dias',  days: 7  },
  { label: '30 dias', days: 30 },
  { label: 'Tudo',    days: null },
]

function formatAcao(acao) {
  if (!acao) return '—'

  if (acao.includes('·')) {
    const parts = acao.split('·').map((p) => p.trim())

    if (parts[0] === 'Venda') {
      return <strong>{parts[1]}</strong>
    }

    const nome = parts[1]
    const quantidade = parts[2]
    return nome
      ? <><strong>{nome}</strong>{quantidade ? ` · ${quantidade}` : ''}</>
      : acao
  }

  const match = acao.match(/^.+?\s+o\s+(?:produto|funcionário)\s+(.+)$/i)
  if (match) {
    return <strong style={{ textTransform: 'capitalize' }}>{match[1]}</strong>
  }

  return acao
}

function extrairPedidoId(acao) {
  const match = acao?.match(/pedido_id:(\d+)/)
  return match ? Number(match[1]) : null
}

function formatTimestamp(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return ts
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()

  if (isSameDay(d, today)) return 'Hoje'
  if (isSameDay(d, yesterday)) return 'Ontem'

  return null
}

function filterByDays(logs, days) {
  if (days === null) return logs
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return logs.filter((log) => new Date(log.timestamp) >= cutoff)
}

function groupByDay(logs) {
  const groups = {}
  for (const log of logs) {
    const d = new Date(log.timestamp)
    if (isNaN(d)) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

function DayGroup({ dateKey, logs }) {
  const [open, setOpen] = useState(true)
  const label = formatDayLabel(dateKey)
  const [pedidoModal, setPedidoModal] = useState(null)
  const [loadingModal, setLoadingModal] = useState(false)
  const [year, month, day] = dateKey.split('-').map(Number)
  const dateFormatted = new Date(year, month - 1, day).toLocaleDateString('pt-BR')

  async function abrirPedido(acao) {
    const id = extrairPedidoId(acao)
    if (!id) return
    setLoadingModal(true)
    try {
      const res = await api.get(`/api/pedidos/${id}`)
      setPedidoModal(res.data?.dados)
    } finally {
      setLoadingModal(false)
    }
  }

  return (
    <div className="logDayGroup">
      <button className="logDayHeader" onClick={() => setOpen((v) => !v)}>
        <span className="logDayLabel">{label ?? dateFormatted}</span>
        <span className="logDayDate">{label ? dateFormatted : null}</span>
        <span className="logDayCount">{logs.length} {logs.length === 1 ? 'registro' : 'registros'}</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && logs.map((item, idx) => (
        <div className="row rowActivity" key={idx}>
          <span>{formatTimestamp(item.timestamp)}</span>
          <span>{item.nome_usuario ?? '—'}</span>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatAcao(item.acao)}
              </span>
              {item.acao?.startsWith('Venda') && (
                <button
                  className="ghostBtn"
                  style={{ fontSize: 12, padding: '2px 8px', height: 26, whiteSpace: 'nowrap' }}
                  onClick={() => abrirPedido(item.acao)}
                  disabled={loadingModal}
                >
                  {loadingModal ? '...' : 'ver pedido'}
                </button>
              )}
            </span>
            <LogBadge acao={item.acao} />
          </span>
        </div>
      ))}

      {pedidoModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setPedidoModal(null)}
        >
          <div
            style={{ background: '#ffffff', color: '#1a1a1a', borderRadius: 14, padding: 24, minWidth: 360, maxWidth: 500, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong style={{ fontSize: 15 }}>Pedido — {pedidoModal.cliente}</strong>
              <button className="ghostBtn" style={{ padding: '2px 8px' }} onClick={() => setPedidoModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              {pedidoModal.tipo} · {pedidoModal.data ? new Date(pedidoModal.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: '6px 16px', fontSize: 13 }}>
              <span style={{ opacity: 0.5, fontWeight: 600 }}>Sabor</span>
              <span style={{ opacity: 0.5, fontWeight: 600 }}>Qtd</span>
              <span style={{ opacity: 0.5, fontWeight: 600 }}>Preço</span>
              {pedidoModal.itens.map((item, i) => (
                <Fragment key={i}>
                  <span>{item.sabor}</span>
                  <span>{item.quantidade} {pedidoModal.categoria === '1kg' ? 'un' : 'kg'}</span>
                  <span>{item.preco != null ? `R$ ${Number(item.preco).toFixed(2)}` : '—'}</span>
                </Fragment>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'flex-end', fontSize: 14, fontWeight: 700 }}>
              Total: R$ {pedidoModal.itens.reduce((acc, i) => acc + (i.preco ?? 0) * i.quantidade, 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function RecentActivityTable() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDays, setActiveDays] = useState(7)

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

  const filtered = filterByDays(logs, activeDays)
  const groups = groupByDay(filtered)

  const filterBar = (
    <div className="logFilterBar">
      {FILTERS.map((f) => (
        <button
          key={f.label}
          className={`logFilterBtn${activeDays === f.days ? ' active' : ''}`}
          onClick={() => setActiveDays(f.days)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )

  return (
    <SectionCard
      title="Atividade recente"
      subtitle="Logs de ações dos usuários carregados da API."
      headerAction={filterBar}
    >
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

        {!loading && !error && filtered.length === 0 && (
          <div className="row rowActivity">
            <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>
              Nenhum registro no período selecionado.
            </span>
          </div>
        )}

        {!loading && !error && groups.map(([dateKey, dayLogs]) => (
          <DayGroup key={dateKey} dateKey={dateKey} logs={dayLogs} />
        ))}
      </div>
    </SectionCard>
  )
}
