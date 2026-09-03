import { useState, useEffect, useRef } from 'react'
import './App.css'

const API = 'http://localhost:3001'

const STEPS = [
  '🔍 Analyzing your prompt...',
  '📐 Planning layout structure...',
  '🧱 Building HTML components...',
  '🎨 Writing CSS styles...',
  '✨ Adding animations...',
  '🔧 Finalizing the page...',
]

function time() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const [models, setModels] = useState([])
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [preview, setPreview] = useState('')
  const [rightView, setRightView] = useState('desktop')
  const [panelTab, setPanelTab] = useState('preview')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [projectName, setProjectName] = useState('Untitled')
  const chatEnd = useRef(null)
  const stepInterval = useRef(null)

  useEffect(() => {
    fetch(`${API}/models`)
      .then(r => r.json())
      .then(data => { setModels(data); setModel(data[0]?.id || '') })
      .catch(() => {})
  }, [])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, step])

  useEffect(() => {
    if (loading) {
      setStep(0)
      stepInterval.current = setInterval(() => {
        setStep(s => (s + 1) % STEPS.length)
      }, 1800)
    } else {
      clearInterval(stepInterval.current)
    }
    return () => clearInterval(stepInterval.current)
  }, [loading])

  async function sendPrompt() {
    if (!prompt.trim() || loading) return
    const currentPrompt = prompt
    setPrompt('')
    setMessages(prev => [...prev, { role: 'user', text: currentPrompt, time: time() }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, history, prompt: currentPrompt })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setPreview(data.html)
      setPanelTab('preview')
      setHistory(prev => [
        ...prev,
        { role: 'user', content: currentPrompt },
        { role: 'assistant', content: data.html }
      ])
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `✓ Done via ${data.usedProvider}`,
        sub: 'Preview is live → ask me to change anything',
        time: time()
      }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `✗ ${err.message}`, time: time() }])
    }
    setLoading(false)
  }

  function download() {
    if (!preview) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([preview], { type: 'text/html' }))
    a.download = `${projectName}.html`
    a.click()
  }

  function clearAll() {
    setHistory([])
    setMessages([])
    setPreview('')
  }

  const frameWidth = rightView === 'tablet' ? '768px' : rightView === 'mobile' ? '390px' : '100%'

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">PoolUP</span>
          <span className="divider">/</span>
          <input
            className="project-name-input"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </div>
        <div className="navbar-right">
          <button className="btn btn-outline" onClick={download}>Export</button>
          <button className="btn btn-orange">Deploy</button>
        </div>
      </nav>

      <div className="main">
        <div className="left-panel">
          <div className="model-bar">
            <select className="model-select" value={model} onChange={e => setModel(e.target.value)}>
              {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          <div className="chat-area">
            {messages.length === 0 && !loading && (
              <div className="chat-hint">
                <div className="hint-icon">⚡</div>
                <p>Describe any landing page and AI will build it instantly.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                <div className="msg-text">{msg.text}</div>
                {msg.sub && <div className="msg-sub">{msg.sub}</div>}
                <div className="msg-time">{msg.time}</div>
              </div>
            ))}

            {loading && (
              <div className="msg msg-ai loading-msg">
                <div className="step-dot" />
                <div className="msg-text">{STEPS[step]}</div>
              </div>
            )}

            <div ref={chatEnd} />
          </div>

          <div className="input-bar">
            <textarea
              className="prompt-input"
              rows={3}
              placeholder="Describe your landing page... (Enter to send)"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt() }
              }}
            />
            <button className="send-btn" onClick={sendPrompt} disabled={loading}>
              {loading ? <span className="spin">◌</span> : '↑'}
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="preview-toolbar">
            <div className="toolbar-left">
              {['desktop', 'tablet', 'mobile'].map(v => (
                <button
                  key={v}
                  className={`view-btn ${rightView === v ? 'active' : ''}`}
                  onClick={() => setRightView(v)}
                >
                  {v === 'desktop' ? '🖥' : v === 'tablet' ? '📱' : '📲'} {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div className="toolbar-right">
              <button
                className={`tab-btn ${panelTab === 'preview' ? 'active' : ''}`}
                onClick={() => setPanelTab('preview')}
              >Preview</button>
              <button
                className={`tab-btn ${panelTab === 'code' ? 'active' : ''}`}
                onClick={() => setPanelTab('code')}
              >Code</button>
              <div className="toolbar-sep" />
              <button className="toolbar-btn" onClick={clearAll}>Clear</button>
              <button className="toolbar-btn" onClick={download}>↓ HTML</button>
            </div>
          </div>

          <div className="preview-area">
            {panelTab === 'code' ? (
              <pre className="code-view">
                <code>{preview || '// No code generated yet'}</code>
              </pre>
            ) : preview ? (
              <div className="frame-wrap" style={{ width: frameWidth }}>
                <iframe
                  className="preview-frame"
                  srcDoc={preview}
                  title="Preview"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⚡</div>
                <h2>No preview yet</h2>
                <p>Type a prompt on the left and hit Send</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}