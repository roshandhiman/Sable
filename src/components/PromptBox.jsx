import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './PromptBox.css';
const FALLBACK_MODELS = [
  { id: 'groq-gpt120b', label: 'GPT-OSS 120B (Groq)' },
  { id: 'groq-gpt20b', label: 'GPT-OSS 20B (Groq)' },
  { id: 'groq-qwen', label: 'Qwen 3 27B (Groq)' },
  { id: 'mistral-small', label: 'Mistral Small' },
  { id: 'mistral-large', label: 'Mistral Large' },
  { id: 'gemini-flash', label: 'Gemini Flash' },
  { id: 'openrouter-deepseek', label: 'DeepSeek V3' },
  { id: 'nvidia-llama', label: 'Llama 3.3 70B' },
]

export default function PromptBox({ isDarkMode = true }) {
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState(FALLBACK_MODELS)
  const [selectedModel, setSelectedModel] = useState('groq-gpt120b')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate();
//yeh vala local ke liye tha 
  // useEffect(() => {
  //   fetch('http://localhost:3001/models')
  //     .then(r => r.json())
  //     .then(data => {
  //       if (Array.isArray(data) && data.length) {
  //         setModels(data);
  //         setSelectedModel(data[0].id);
  //       }
  //     })
  //     .catch(() => { });
  // }, [])
useEffect(() => {
  const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001';
  fetch(`${API_URL}/models`)
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length) {
        setModels(data);
        setSelectedModel(data[0].id);
      }
    })
    .catch(() => {});
}, [])
  const selected = models.find((model) => model.id === selectedModel)

  function selectModel(id) {
    setSelectedModel(id)
    setIsMenuOpen(false)
  }

  // function sendPrompt() {
  //   console.log('Prompt:', prompt, 'Model:', selectedModel)
  // }
  function sendPrompt() {
  if (!prompt.trim()) return;
  navigate('/workspace', { state: { prompt, model: selectedModel } });
}
  return (
    <section className={`prompt-box ${isDarkMode ? 'dark' : 'light'}`}>
      <textarea
        className="prompt-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What landing page shall we design?"
        rows={4}
      />

      <div className="prompt-actions">
        <div className="model-picker">
          <button
            className="model-trigger"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
          >
            <span className="model-status" />
            <span>{selected?.label || 'Select model'}</span>
            <span className="model-chevron">{isMenuOpen ? '⌃' : '⌄'}</span>
          </button>

          {isMenuOpen && (
            <div className="model-menu">
              <span className="model-menu-label">Choose a model</span>
              {models.map((model) => (
                <button
                  className={`model-option ${model.id === selectedModel ? 'is-selected' : ''}`}
                  key={model.id}
                  type="button"
                  onClick={() => selectModel(model.id)}
                >
                  <span>{model.label}</span>
                  {model.id === selectedModel && <span className="model-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="send-button"
          type="button"
          onClick={sendPrompt}
        >
          Send <span>↑</span>
        </button>
      </div>
    </section>
  )
}
