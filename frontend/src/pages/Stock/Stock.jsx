import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
import api from '../../api/axiosInstance'
import { MiniMetric, SectionCard } from '../../components/Cards'
import { SelectField } from '../../components/FormFields'
import { cx, formatValidade, normalizeStockRows } from '../../utils/formatters'
import './Stock.css'
import { extractApiMessage } from '../../utils/api'
import Toast from '../../components/Toast'

function ProductDropdown({ value, onChange, options, loading }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))

  function select(opt) {
    onChange(opt)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="prodDropdown" ref={ref}>
      <button
        type="button"
        className={`prodDropdownTrigger${open ? ' open' : ''}`}
        onClick={() => !loading && setOpen((v) => !v)}
        disabled={loading}
      >
        <span className={value ? 'prodDropdownValue' : 'prodDropdownPlaceholder'}>
          {loading ? 'Carregando produtos...' : value || 'Selecionar produto...'}
        </span>
        <ChevronDown size={15} className={`prodDropdownChevron${open ? ' rotated' : ''}`} />
      </button>

      {open && (
        <div className="prodDropdownMenu">
          <div className="prodDropdownSearch">
            <Search size={13} />
            <input
              autoFocus
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>
          <ul className="prodDropdownList">
            {filtered.length === 0 ? (
              <li className="prodDropdownEmpty">Nenhum produto encontrado</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt}
                  className={`prodDropdownItem${opt === value ? ' selected' : ''}`}
                  onClick={() => select(opt)}
                >
                  {opt}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export function StockPage() {
  const [rows, setRows] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [tableError, setTableError] = useState(false)
  const [metrics, setMetrics] = useState({ loading: true, error: false, saldo: null, entradas: null, saidas: null })
  const [productOptions, setProductOptions] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [products1kg, setProducts1kg] = useState([])
  const [products1kgLoading, setProducts1kgLoading] = useState(true)
  const [rows1kg, setRows1kg] = useState([])
  const [tableLoading1kg, setTableLoading1kg] = useState(true)
  const [tableError1kg, setTableError1kg] = useState(false)
  const [pedidoForm, setPedidoForm] = useState({ cliente: '', tipo: '', categoria: 'kg' })
  const [pedidoItens, setPedidoItens] = useState([{ sabor: '', quantidade: '' }])
  const [submittingPedido, setSubmittingPedido] = useState(false)

  const [movForm, setMovForm] = useState({ sabor: '', quantidade_kg: '', acao: '', tipo: '' })
  const [submittingMov, setSubmittingMov] = useState(false)

  function handleMovChange(field, value) {
    setMovForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleMovClear() {
    setMovForm({ sabor: '', quantidade_kg: '', acao: '', tipo: '' })
  }

  async function handleMovSalvar() {
    if (submittingMov) return
    const { sabor, quantidade_kg, acao } = movForm
    if (!sabor) { notify({ type: 'error', title: 'Campo obrigatório', message: 'Selecione o produto.' }); return }
    if (!quantidade_kg) { notify({ type: 'error', title: 'Campo obrigatório', message: 'Informe a quantidade.' }); return }
    if (!acao) { notify({ type: 'error', title: 'Campo obrigatório', message: 'Selecione a ação.' }); return }
    if (acao === 'Venda' && !movForm.tipo) { notify({ type: 'error', title: 'Campo obrigatório', message: 'Selecione o tipo (PF ou CNPJ) para registrar uma venda.' }); return }

    setSubmittingMov(true)
    try {
      await api.post('/api/estoque/movimentacoes', {
        sabor,
        quantidade_kg: Number(quantidade_kg),
        acao,
        tipo: movForm.tipo || null,
      })
      notify({ type: 'success', title: 'Movimentação registrada', message: `${acao} de ${sabor} (${quantidade_kg} Kg) salva com sucesso.` })
      handleMovClear()
      await loadTable({ current: false })
      await loadMetrics({ current: false })
    } catch (err) {
      const msg = extractApiMessage(err?.response?.data) || err?.message || 'Erro ao registrar movimentação.'
      notify({ type: 'error', title: 'Erro ao salvar', message: msg })
    } finally {
      setSubmittingMov(false)
    }
  }

  function handlePedidoFormChange(field, value) {
    setPedidoForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'categoria') {
      setPedidoItens([{ sabor: '', quantidade: '' }])
    }
  }

  function handleAddItem() {
    setPedidoItens((prev) => [...prev, { sabor: '', quantidade: '' }])
  }

  function handleRemoveItem(index) {
    setPedidoItens((prev) => prev.filter((_, i) => i !== index))
  }

  function handleItemChange(index, field, value) {
    setPedidoItens((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function handlePedidoClear() {
    setPedidoForm({ cliente: '', tipo: '', categoria: 'kg' })
    setPedidoItens([{ sabor: '', quantidade: '' }])
  }

  async function loadProducts1kg(ignore) {
    setProducts1kgLoading(true)
    try {
      const res = await api.get('/api/estoque/1kg/produtos')
      if (ignore?.current) return
      const data = res?.data?.dados ?? []
      setProducts1kg(Array.isArray(data) ? data : [])
    } catch {
      if (ignore?.current) return
      setProducts1kg([])
    } finally {
      if (!ignore?.current) setProducts1kgLoading(false)
    }
  }

  async function loadTable1kg(ignore) {
    setTableLoading1kg(true)
    setTableError1kg(false)
    try {
      const res = await api.get('/api/estoque/1kg/tabela')
      if (ignore?.current) return
      const data = res?.data?.dados ?? []
      setRows1kg(Array.isArray(data) ? data : [])
    } catch {
      if (ignore?.current) return
      setTableError1kg(true)
      setRows1kg([])
    } finally {
      if (!ignore?.current) setTableLoading1kg(false)
    }
  }

  function notify(next) {
    setToast({ id: globalThis.crypto?.randomUUID?.() || String(Date.now()), ...next })
  }

  async function handlePedidoSalvar() {
    if (submittingPedido) return

    const { cliente, tipo, categoria } = pedidoForm

    if (!cliente.trim()) {
      notify({ type: 'error', title: 'Campo obrigatório', message: 'Informe o nome do cliente.' })
      return
    }
    if (!tipo) {
      notify({ type: 'error', title: 'Campo obrigatório', message: 'Selecione o tipo (PF ou CNPJ).' })
      return
    }

    const itensValidos = pedidoItens.filter((i) => i.sabor && i.quantidade)
    if (itensValidos.length === 0) {
      notify({ type: 'error', title: 'Pedido vazio', message: 'Adicione ao menos um produto com quantidade.' })
      return
    }

    setSubmittingPedido(true)
    try {
      await api.post('/api/pedidos', {
        cliente: cliente.trim(),
        tipo,
        categoria,
        itens: itensValidos.map((i) => ({ sabor: i.sabor, quantidade: Number(i.quantidade) })),
      })
      notify({ type: 'success', title: 'Pedido registrado', message: `Pedido de ${cliente.trim()} salvo com sucesso.` })
      handlePedidoClear()
      await loadTable({ current: false })
      await loadTable1kg({ current: false })
      await loadMetrics({ current: false })
    } catch (err) {
      const msg = extractApiMessage(err?.response?.data) || err?.message || 'Erro ao registrar pedido.'
      notify({ type: 'error', title: 'Erro ao salvar', message: msg })
    } finally {
      setSubmittingPedido(false)
    }
  }

  async function loadProducts(ignore) {
    setProductsLoading(true)
    try {
      const res = await api.get('/api/estoque/produtos')
      if (ignore?.current) return
      const data = res?.data?.dados ?? res?.data?.data ?? res?.data ?? []
      setProductOptions(Array.isArray(data) ? data : [])
    } catch {
      if (ignore?.current) return
      setProductOptions([])
    } finally {
      if (!ignore?.current) setProductsLoading(false)
    }
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
        loading: false, error: false,
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
    loadProducts(ignore)
    loadProducts1kg(ignore)
    loadTable1kg(ignore)
    return () => { ignore.current = true }
  }, [])

  function fmtKg(v) {
    if (v == null) return '--'
    const n = Number(v)
    return Number.isFinite(n) ? `${n.toLocaleString('pt-BR')} Kg` : String(v)
  }

  const mVal = (raw) => metrics.loading ? 'Carregando...' : metrics.error ? '--' : fmtKg(raw)

  const [tableFilter, setTableFilter] = useState('Visão Geral')

  const filterOptions = ['Visão Geral', 'Disponível', 'Indisponível', 'Vencido']
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [filterOpen])

  const tableFilterSelect = (
    <div className="stockFilterWrapper" ref={filterRef}>
      <span className="stockFilterLabel">Filtrar por</span>
      <div className="prodDropdown" style={{ minWidth: 160 }}>
        <button
          type="button"
          className={`prodDropdownTrigger${filterOpen ? ' open' : ''}`}
          style={{ height: 38, fontSize: 13, borderRadius: 10, padding: '0 12px' }}
          onClick={() => setFilterOpen((v) => !v)}
        >
          <span className="prodDropdownValue">{tableFilter}</span>
          <ChevronDown size={14} className={`prodDropdownChevron${filterOpen ? ' rotated' : ''}`} />
        </button>
        {filterOpen && (
          <div className="prodDropdownMenu">
            <ul className="prodDropdownList" style={{ padding: '6px' }}>
              {filterOptions.map((opt) => (
                <li
                  key={opt}
                  className={`prodDropdownItem${opt === tableFilter ? ' selected' : ''}`}
                  onClick={() => { setTableFilter(opt); setFilterOpen(false) }}
                >
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="pageStack">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="metricGrid compactMetrics">
        <MiniMetric title="Total de Produtos em Kg" value={mVal(metrics.saldo)}    detail="Somatório de todos os produtos em estoque (kg)" />
        <MiniMetric title="Entradas hoje" value={mVal(metrics.entradas)} detail="Movimentação recebida no dia" />
        <MiniMetric title="Saídas hoje"   value={mVal(metrics.saidas)}   detail="Pedidos e baixas operacionais" />
      </div>

      <SectionCard title="Gerenciar Estoque" subtitle="Registre entradas, vendas, retiradas e vencimentos de produtos.">
        <div className="filtersGrid">
          <div className="field">
            <span>Produto</span>
            <ProductDropdown
              value={movForm.sabor}
              onChange={(v) => handleMovChange('sabor', v)}
              options={productOptions}
              loading={productsLoading}
            />
          </div>

          <label className="field">
            <span>Quantidade (Kg)</span>
            <input
              type="number"
              min="0"
              placeholder="Ex: 10"
              value={movForm.quantidade_kg}
              onChange={(e) => handleMovChange('quantidade_kg', e.target.value)}
            />
          </label>

          <SelectField
            label="Ação"
            value={movForm.acao}
            onChange={(v) => handleMovChange('acao', v)}
            options={['Adicionar', 'Retirar']}
            placeholder="Selecionar ação..."
          />

        </div>

        <div className="sectionActions">
          <button className="btn" onClick={handleMovSalvar} disabled={submittingMov}>
            <Plus size={15} />
            {submittingMov ? 'Salvando...' : 'Salvar Movimentação'}
          </button>
          <button className="ghostBtn" onClick={handleMovClear}>
            <X size={15} />
            Limpar Campos
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Registrar Pedido" subtitle="Preencha os dados do cliente e adicione os produtos do pedido.">
        <div className="filtersGrid">
          <label className="field">
            <span>Cliente</span>
            <input
              type="text"
              placeholder="Nome do cliente"
              value={pedidoForm.cliente}
              onChange={(e) => handlePedidoFormChange('cliente', e.target.value)}
            />
          </label>

          <SelectField
            label="Tipo"
            value={pedidoForm.tipo}
            onChange={(v) => handlePedidoFormChange('tipo', v)}
            options={['Pessoa Física (PF)', 'Pessoa Jurídica (CNPJ)']}
            placeholder="Selecionar tipo..."
          />

          <SelectField
            label="Categoria"
            value={pedidoForm.categoria}
            onChange={(v) => handlePedidoFormChange('categoria', v)}
            options={['kg', '1kg']}
            placeholder="Selecionar categoria..."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pedidoItens.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 10, alignItems: 'end' }}>
              <div className="field">
                {index === 0 && <span>Produto</span>}
                <ProductDropdown
                  value={item.sabor}
                  onChange={(v) => handleItemChange(index, 'sabor', v)}
                  options={pedidoForm.categoria === '1kg' ? products1kg : productOptions}
                  loading={productsLoading}
                />
              </div>
              <label className="field">
                {index === 0 && <span>Quantidade</span>}
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 10"
                  value={item.quantidade}
                  onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                />
              </label>
              <button
                type="button"
                className="dangerBtn"
                style={{ height: 50, width: 36, padding: 0, justifyContent: 'center', alignSelf: 'end' }}
                onClick={() => handleRemoveItem(index)}
                disabled={pedidoItens.length === 1}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="ghostBtn" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAddItem}>
          <Plus size={15} />
          Adicionar produto
        </button>

        <div className="sectionActions">
          <button className="btn" onClick={handlePedidoSalvar} disabled={submittingPedido}>
            <Plus size={15} />
            {submittingPedido ? 'Salvando...' : 'Salvar Pedido'}
          </button>
          <button className="ghostBtn" onClick={handlePedidoClear}>
            <X size={15} />
            Limpar Campos
          </button>
        </div>
      </SectionCard>

      {/* ── Tabela de Estoque normal ── */}
      <SectionCard title="Tabela de Estoque" subtitle="Visualização completa dos produtos em estoque, preços e disponibilidade." headerAction={tableFilterSelect}>
        <div className="table modernTable stockTable">
          <div className="row head rowStock">
            <span>Produto</span>
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

          {!tableLoading && !tableError && (() => {
            const filtered = tableFilter === 'Visão Geral'
              ? rows
              : rows.filter((r) => r.status === tableFilter)
            if (filtered.length === 0) return (
              <div className="row rowStock">
                <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Nenhum produto disponível.</span>
              </div>
            )
            return filtered.map((row) => (
              <div className="row rowStock" key={row.product}>
                <span>{row.product}</span>
                <span>{row.precoPF   ?? '--'}</span>
                <span>{row.precoCNPJ ?? '--'}</span>
                <span>{row.quantity  ?? '--'}</span>
                <span>
                  <span className={cx('pill', row.status === 'Disponível' ? 'ok' : row.status === 'Indisponível' ? 'bad' : row.status ? 'mid' : '')}>
                    {row.status ?? '--'}
                  </span>
                </span>
              </div>
            ))
          })()}
        </div>
      </SectionCard>

      {/* ── Tabela de Estoque (1kg) ── */}
      <SectionCard title="Tabela de Estoque (1kg)" subtitle="Produtos em embalagem de 1kg, quantidades em unidades.">
        <div className="table modernTable stockTable">
          <div className="row head rowStock">
            <span>Produto</span>
            <span>Preço PF</span>
            <span>Preço CNPJ</span>
            <span>Quantidade (Kg)</span>
            <span>Status</span>
          </div>

          {tableLoading1kg && (
            <div className="row rowStock">
              <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Carregando estoque...</span>
            </div>
          )}

          {!tableLoading1kg && tableError1kg && (
            <div className="row rowStock">
              <span style={{ gridColumn: '1 / -1', color: 'var(--red, #e55)', padding: '4px 0' }}>
                Não foi possível carregar os dados do estoque.
              </span>
            </div>
          )}

          {!tableLoading1kg && !tableError1kg && (
            rows1kg.length === 0
              ? (
                <div className="row rowStock">
                  <span style={{ gridColumn: '1 / -1', opacity: 0.5, padding: '4px 0' }}>Nenhum produto disponível.</span>
                </div>
              )
              : rows1kg.map((row) => (
                <div className="row rowStock" key={row.sabor}>
                  <span>{row.sabor}</span>
                  <span>{row.preco_pf ?? '--'}</span>
                  <span>{row.preco_cnpj ?? '--'}</span>
                  <span>{row.quantidade != null ? `${row.quantidade} Kg` : '--'}</span>
                  <span>
                    <span className={cx('pill', row.disponivel === 1 ? 'ok' : 'bad')}>
                      {row.disponivel === 1 ? 'Disponível' : 'Indisponível'}
                    </span>
                  </span>
                </div>
              ))
          )}
        </div>
      </SectionCard>
    </div>
  )
}
