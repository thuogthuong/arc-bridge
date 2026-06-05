import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { CryptoBg } from './CryptoBg'
import { ALL_CHAINS, ChainId, loadHistory, TxRecord } from '../lib/config'
import { useBridge } from '../hooks/useBridge'
import { T, Lang } from '../lib/i18n'

function shortAddr(a: string) { return `${a.slice(0,6)}...${a.slice(-4)}` }
function timeAgo(ts: number, t: typeof T['en']) {
  const d = (Date.now() - ts) / 1000
  if (d < 60) return t.timeJustNow
  if (d < 3600) return t.timeMin(Math.floor(d/60))
  if (d < 86400) return t.timeHour(Math.floor(d/3600))
  return t.timeDay(Math.floor(d/86400))
}

export function BridgeApp() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }           = useDisconnect()

  // Theme
  const [dark, setDark] = useState(() => localStorage.getItem('arc-bridge-theme') === 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('arc-bridge-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Language — default EN
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('arc-bridge-lang') as Lang) || 'en')
  useEffect(() => { localStorage.setItem('arc-bridge-lang', lang) }, [lang])
  const t = T[lang]

  // State
  const [fromChain, setFromChain]   = useState<ChainId>('Base_Sepolia')
  const [toChain, setToChain]       = useState<ChainId>('Arc_Testnet')
  const [amount, setAmount]         = useState('1')
  const [recipient, setRecipient]   = useState('')
  const [useCustom, setUseCustom]   = useState(false)
  const [activeTab, setActiveTab]   = useState<'bridge' | 'history'>('bridge')
  const [history, setHistory]       = useState<TxRecord[]>([])

  const { status, fees, steps, error, estimate, bridge, reset } = useBridge()

  useEffect(() => { setHistory(loadHistory()) }, [activeTab])

  function swapChains() {
    const tmp = fromChain
    setFromChain(toChain)
    setToChain(tmp)
    reset()
  }

  async function handleEstimate() { await estimate(fromChain, toChain, amount) }
  async function handleBridge() {
    await bridge(fromChain, toChain, amount, useCustom && recipient ? recipient : undefined)
    setHistory(loadHistory())
  }

  const fromInfo   = ALL_CHAINS.find(c => c.id === fromChain)!
  const toInfo     = ALL_CHAINS.find(c => c.id === toChain)!
  const totalFee   = fees.reduce((s, f) => s + parseFloat(f.amount || '0'), 0)
  const willReceive = Math.max(0, parseFloat(amount || '0') - totalFee)

  const STEP_LABELS: Record<string, string> = {
    approve: t.stepApprove, burn: t.stepBurn,
    fetchAttestation: t.stepAttestation, mint: t.stepMint,
    transfer: t.stepTransfer, send: t.stepSend,
  }

  return (
    <div className="app">
      <CryptoBg />

      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-name">Arc Bridge</span>
          <span className="logo-sub">{t.tagline}</span>
        </div>
        <div className="header-right">
          {/* Language toggle */}
          <button
            className="theme-toggle"
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            title="Switch language"
            style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.05em' }}
          >
            {lang === 'en' ? '🇻🇳 VI' : '🇺🇸 EN'}
          </button>
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={() => setDark(!dark)} title="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          {isConnected && (
            <div className="wallet-row">
              <span className="chain-pill">Arc Testnet</span>
              <span className="wallet-addr">{shortAddr(address!)}</span>
              <button className="btn-sm" onClick={() => disconnect()}>disconnect</button>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <div className="card">

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${activeTab === 'bridge' ? 'active' : ''}`}
              onClick={() => setActiveTab('bridge')}>{t.tabBridge}</button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setHistory(loadHistory()) }}>
              {t.tabHistory} {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
          </div>

          {/* ── BRIDGE TAB ── */}
          {activeTab === 'bridge' && (<>
            <div className="card-title">
              <h1>{t.title}</h1>
              <p>{t.subtitle}</p>
            </div>

            {/* Chain selector */}
            <div className="chain-row">
              <div className="chain-picker">
                <label className="field-label">{t.labelFrom}</label>
                <select className="chain-select" value={fromChain}
                  onChange={e => { setFromChain(e.target.value as ChainId); reset() }}
                  style={{ borderColor: fromInfo.color }}>
                  {ALL_CHAINS.filter(c => c.id !== toChain).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <button className="swap-btn" onClick={swapChains} title={t.swapTitle}>⇄</button>
              <div className="chain-picker">
                <label className="field-label">{t.labelTo}</label>
                <select className="chain-select" value={toChain}
                  onChange={e => { setToChain(e.target.value as ChainId); reset() }}
                  style={{ borderColor: toInfo.color }}>
                  {ALL_CHAINS.filter(c => c.id !== fromChain).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div className="field-group">
              <label className="field-label">{t.labelAmount}</label>
              <div className="amount-wrap">
                <input className="amount-input" type="number" min="0.01" step="0.01"
                  value={amount} placeholder="0.00"
                  onChange={e => { setAmount(e.target.value); reset() }} />
                <span className="amount-unit">USDC</span>
              </div>
              <div className="presets">
                {['1','5','10','50','100'].map(v => (
                  <button key={v} className="preset" onClick={() => { setAmount(v); reset() }}>{v}</button>
                ))}
              </div>
            </div>

            {/* Custom recipient */}
            <div className="field-group">
              <label className="toggle-label">
                <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} />
                {t.labelCustom}
              </label>
              {useCustom && (
                <input className="text-input" placeholder={t.placeholderRecipient}
                  value={recipient} onChange={e => setRecipient(e.target.value)} />
              )}
            </div>

            {/* Fee box */}
            {fees.length > 0 && (
              <div className="fee-box">
                <div className="fee-title">{t.feeTitle}</div>
                {fees.map((f, i) => (
                  <div key={i} className="fee-row">
                    <span>{f.type === 'provider' ? t.feeCCTP : f.type === 'gas' ? t.feeGas : f.type}</span>
                    <span>{f.amount} {f.currency || 'USDC'}</span>
                  </div>
                ))}
                <div className="fee-row fee-total">
                  <span>{t.feeTotal}</span><span>~{totalFee.toFixed(4)} USDC</span>
                </div>
                <div className="fee-row fee-receive">
                  <span>{t.feeReceive}</span><span>~{willReceive.toFixed(4)} USDC</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="error-box">❌ {error}</div>}

            {/* Steps */}
            {steps.length > 0 && (
              <div className="steps-box">
                <div className="steps-title">{t.stepsTitle}</div>
                {steps.map((s, i) => (
                  <div key={i} className={`step step-${s.state}`}>
                    <span>{s.state === 'success' ? '✅' : s.state === 'error' ? '❌' : '⏳'}</span>
                    <span className="step-name">{STEP_LABELS[s.name] ?? s.name}</span>
                    {s.explorerUrl && (
                      <a href={s.explorerUrl} target="_blank" rel="noopener noreferrer" className="step-link">↗</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            {!isConnected ? (
              <div className="connect-list">
                {connectors.map(c => (
                  <button key={c.id} className="btn-primary" onClick={() => connect({ connector: c })}>
                    {t.btnConnect} {c.name}
                  </button>
                ))}
              </div>
            ) : status === 'idle' || status === 'error' ? (
              <button className="btn-primary" onClick={handleEstimate}
                disabled={!amount || parseFloat(amount) <= 0}>
                {t.btnEstimate}
              </button>
            ) : status === 'estimating' ? (
              <button className="btn-primary loading" disabled>{t.btnEstimating}</button>
            ) : status === 'ready' ? (
              <div className="action-row">
                <button className="btn-secondary" onClick={reset}>{t.btnBack}</button>
                <button className="btn-primary" onClick={handleBridge}>
                  {t.btnBridge} {amount} USDC
                </button>
              </div>
            ) : status === 'bridging' ? (
              <button className="btn-primary loading" disabled>{t.btnBridging}</button>
            ) : status === 'done' ? (
              <div className="done-box">
                <div className="done-icon">🎉</div>
                <div className="done-text">{t.doneTitle}</div>
                <div className="done-sub">{t.doneSub(amount, toInfo.name)}</div>
                <button className="btn-secondary" onClick={reset}>{t.btnBridgeMore}</button>
              </div>
            ) : null}

            {/* Info grid */}
            <div className="info-grid">
              <div className="info-item"><span>⚡ Speed</span><span>{t.infoSpeed}</span></div>
              <div className="info-item"><span>🔐 Protocol</span><span>Circle CCTP v2</span></div>
              <div className="info-item">
                <span>🪙 Faucet</span>
                <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer">{t.infoFaucet} ↗</a>
              </div>
              <div className="info-item">
                <span>🔍 Explorer</span>
                <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer">{t.infoExplorer} ↗</a>
              </div>
            </div>
          </>)}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="history-tab">
              <h2 className="history-title">{t.historyTitle}</h2>
              {history.length === 0 ? (
                <div className="history-empty">{t.historyEmpty}</div>
              ) : (
                <div className="history-list">
                  {history.map(tx => {
                    const from = ALL_CHAINS.find(c => c.id === tx.fromChain)
                    const to   = ALL_CHAINS.find(c => c.id === tx.toChain)
                    return (
                      <div key={tx.id} className={`history-item hi-${tx.status}`}>
                        <div className="hi-top">
                          <div className="hi-route">
                            <span style={{ color: from?.color }}>{from?.icon} {from?.name ?? tx.fromChain}</span>
                            <span className="hi-arrow">→</span>
                            <span style={{ color: to?.color }}>{to?.icon} {to?.name ?? tx.toChain}</span>
                          </div>
                          <div className={`hi-status hi-${tx.status}`}>
                            {tx.status === 'success' ? '✅' : tx.status === 'error' ? '❌' : '⏳'}
                            {tx.status}
                          </div>
                        </div>
                        <div className="hi-bottom">
                          <span className="hi-amount">{tx.amount} USDC</span>
                          <span className="hi-time">{timeAgo(tx.timestamp, t)}</span>
                          {tx.explorerUrl && (
                            <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="hi-link">
                              {t.historyView}
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <button className="btn-secondary" style={{ marginTop: '1rem' }}
                onClick={() => { localStorage.removeItem('arc-bridge-history'); setHistory([]) }}>
                {t.historyClear}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
