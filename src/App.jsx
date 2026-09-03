import { useState, useEffect } from 'react'
import './App.css'

const API = 'http://localhost:3001'

export default function App() {
  const [models, setModels] = useState([])
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [preview, setPreview] = useState('')
  const [view, setView] = useState('desktop')
  const [loading, setLoading] = useState(false)
  const [projectName, setProjectName] = useState('Untitled')

  useEffect(() => {
    fetch(`${API}/models`)
      .then(r => r.json())
      .then(data => {
        setModels(data)
        setModel(data[0]?.id || '')
      })
  }, [])

  async function sendPrompt() {
    if (!prompt.trim() || loading) return
    const userMsg = { role: 'user', text: prompt }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    const currentPrompt = prompt
    setPrompt('')

    try {
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, history, prompt: currentPrompt })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setPreview(data.html)
      setHistory(prev => [
        ...prev,
        { role: 'user', content: currentPrompt },
        { role: 'assistant', content: data.html }
      ])
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Generated via ${data.usedProvider}`
      }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}` }])
    }
    setLoading(false)
  }

  const frameWidth = view === 'desktop' ? '100%' : view === 'tablet' ? '768px' : '390px'

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
          <button className="btn btn-outline" onClick={() => {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(new Blob([preview], { type: 'text/html' }))
            a.download = `${projectName}.html`
            a.click()
          }}>Export</button>
          <button className="btn btn-orange">Deploy</button>
        </div>
      </nav>

      <div className="main">
        <div className="left-panel">
          <div className="model-bar">
            <select
              className="model-select"
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="chat-area">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="msg msg-ai">Generating...</div>}
          </div>

          <div className="input-bar">
            <textarea
              className="prompt-input"
              rows={3}
              placeholder="Describe your landing page..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendPrompt()
                }
              }}
            />
            <button className="send-btn" onClick={sendPrompt} disabled={loading}>
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="preview-toolbar">
            {['desktop', 'tablet', 'mobile'].map(v => (
              <button
                key={v}
                className={`view-btn ${view === v ? 'active' : ''}`}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            <div className="spacer" />
            <button className="toolbar-btn" onClick={() => {
              setHistory([])
              setMessages([])
              setPreview('')
            }}>Clear</button>
            <button className="toolbar-btn" onClick={() => {
              const a = document.createElement('a')
              a.href = URL.createObjectURL(new Blob([preview], { type: 'text/html' }))
              a.download = `${projectName}.html`
              a.click()
            }}>Download HTML</button>
          </div>

          <div className="preview-area">
            {preview ? (
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