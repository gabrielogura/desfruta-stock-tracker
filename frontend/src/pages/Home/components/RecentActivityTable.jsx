import { useEffect, useState } from 'react'
import api from '../../../api/axiosInstance'
import { SectionCard } from '../../../components/Cards'
import { LogBadge } from './LogBadge'

export function RecentActivityTable() {
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
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
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

        {!loading && !error && logs.map((item, idx) => (
          <div className="row rowActivity" key={idx}>
            <span>{formatTimestamp(item.timestamp)}</span>
            <span>{item.nome_usuario ?? '—'}</span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(() => {
                  const parts = item.acao?.split('·') ?? []
                  const produto = parts[1]?.trim()
                  const quantidade = parts[2]?.trim()
                  return produto ? <><strong>{produto}</strong>{quantidade ? ` · ${quantidade}` : ''}</> : item.acao
                })()}
              </span>
              <LogBadge acao={item.acao} />
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
