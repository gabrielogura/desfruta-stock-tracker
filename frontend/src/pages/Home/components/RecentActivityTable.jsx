import { useEffect, useState } from 'react'
import api from '../../../api/axiosInstance'
import { SectionCard } from '../../../components/Cards'
import { LogBadge } from './LogBadge'

// Padrões do backend:
// Estoque:    "adicionar  ·  Abacaxi  ·  10 Kg"
// Produto:    "Cadastrou o produto Cacau"
// Produto:    "Deletou o produto Cacau"
// Produto:    "Atualizou o produto Cacau"
// Funcionário: "Cadastrou o funcionário João"
// Funcionário: "Deletou o funcionário João"
function formatAcao(acao) {
  if (!acao) return '—'

  // Formato com · (estoque): "acao · Nome · 10 Kg"
  if (acao.includes('·')) {
    const parts = acao.split('·').map((p) => p.trim())
    const nome = parts[1]
    const quantidade = parts[2]
    return nome
      ? <><strong>{nome}</strong>{quantidade ? ` · ${quantidade}` : ''}</>
      : acao
  }

  // Formato textual: "Verbo o produto Nome" ou "Verbo o funcionário Nome"
  const match = acao.match(/^.+?\s+o\s+(?:produto|funcionário)\s+(.+)$/i)
  if (match) {
    return <strong style={{ textTransform: 'capitalize' }}>{match[1]}</strong>
  }

  return acao
}

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
                {formatAcao(item.acao)}
              </span>
              <LogBadge acao={item.acao} />
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
