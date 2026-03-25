import api from '../../api/axiosInstance'
import { useEffect, useState } from 'react'
import { MiniMetric, SectionCard } from '../../components/Cards'
import { DASHBOARD_SUMMARY } from '../../constants/nav'
import './Dashboard.css'

export function DashboardPage() {
  const [volumeLoading, setVolumeLoading] = useState(true)
  const [volumeKg, setVolumeKg] = useState(null)
  const [faturamentoLoading, setFaturamentoLoading] = useState(true)
  const [faturamento, setFaturamento] = useState(null)
  const [ticketMedioLoading, setTicketMedioLoading] = useState(true)
  const [ticketMedio, setTicketMedio] = useState(null)

  async function loadVolume(ignore) {
    setVolumeLoading(true)
    try {
      const res = await api.get('/api/dashboard/volume-vendido')
      if (ignore?.current) return
      const data = res?.data ?? {}
      setVolumeKg(data.dados ?? 0)
    } catch {
      if (ignore?.current) return
      setVolumeKg(null)
    } finally {
      if (!ignore?.current) setVolumeLoading(false)
    }
  }

  async function loadFaturamento(ignore) {
    setFaturamentoLoading(true)
    try {
      const res = await api.get('/api/dashboard/faturamento')
      if (ignore?.current) return
      const data = res?.data ?? {}
      setFaturamento(data.dados ?? 0)
    } catch {
      if (ignore?.current) return
      setFaturamento(null)
    } finally {
      if (!ignore?.current) setFaturamentoLoading(false)
    }
  }

  async function loadTicketMedio(ignore) {
    setTicketMedioLoading(true)
    try {
      const res = await api.get('/api/dashboard/ticket_medio')
      if (ignore?.current) return
      const data = res?.data ?? {}
      setTicketMedio(data.dados ?? 0)
    } catch {
      if (ignore?.current) return
      setTicketMedio(null)
    } finally {
      if (!ignore?.current) setTicketMedioLoading(false)
    }
  }

  useEffect(() => {
    const ignore = { current: false }
    loadVolume(ignore)
    loadFaturamento(ignore)
    loadTicketMedio(ignore)
    return () => { ignore.current = true }
  }, [])

  return (
    <div className="pageStack">
      <div className="metricGrid compactMetrics">
        <MiniMetric
          title="Volume vendido"
          value={volumeLoading ? 'Carregando...' : volumeKg != null ? `${Number(volumeKg).toLocaleString('pt-BR')} Kg` : '--'}
          detail="Total vendido no mês atual"
          />
        <MiniMetric
          title="Faturamento mensal"
          value={faturamentoLoading ? 'Carregando...' : faturamento != null ? `R$${Number(faturamento).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '--'}
          detail="Total faturado no mês atual"
          />
        <MiniMetric
          title="Ticket Médio"
          value={ticketMedioLoading ? 'Carregando...' : ticketMedio != null ? `R$${Number(ticketMedio).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '--'}
          detail="Valor médio por venda no mês"
        />
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
