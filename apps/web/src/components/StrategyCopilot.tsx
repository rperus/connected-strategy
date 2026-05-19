import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { API_BASE_URL } from '../config';

interface Message {
  role: 'user' | 'copilot';
  content: string;
}

export function StrategyCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'copilot', content: 'Hola Rodrigo. Soy Cerebro, tu Strategy Copilot. ¿Qué quieres analizar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeProject } = useProject();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          projectId: activeProject?.id,
        })
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => [...prev, { role: 'copilot', content: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'copilot', content: `Error: ${data.error}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'copilot', content: 'Error de conexión con Cerebro.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'var(--cs-primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontSize: 24
        }}
      >
        {isOpen ? '✕' : '🧠'}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 96,
          right: 24,
          width: 380,
          height: 600,
          backgroundColor: 'var(--cs-bg)',
          border: '1px solid var(--cs-border)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--cs-surface)',
            borderBottom: '1px solid var(--cs-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{ fontSize: 24 }}>🧠</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Cerebro Copilot</div>
              <div style={{ fontSize: 12, color: 'var(--cs-primary)' }}>Online · Contexto: {activeProject?.name || 'Portfolio Global'}</div>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: m.role === 'user' ? 'var(--cs-primary)' : 'var(--cs-surface)',
                color: m.role === 'user' ? 'white' : 'var(--cs-text)',
                padding: '12px 16px',
                borderRadius: '12px',
                borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                borderBottomLeftRadius: m.role === 'copilot' ? 2 : 12,
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: 'var(--cs-surface)',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: 14,
                color: 'var(--cs-text-muted)'
              }}>
                Cerebro está pensando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: 16,
            borderTop: '1px solid var(--cs-border)',
            backgroundColor: 'var(--cs-surface)',
            display: 'flex',
            gap: 8
          }}>
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pregúntame sobre tu estrategia..."
              style={{
                flex: 1,
                backgroundColor: 'var(--cs-bg)',
                border: '1px solid var(--cs-border)',
                borderRadius: 20,
                padding: '10px 16px',
                color: 'var(--cs-text)',
                outline: 'none'
              }}
            />
            <button 
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              style={{
                backgroundColor: input.trim() && !isTyping ? 'var(--cs-primary)' : 'var(--cs-border)',
                color: 'white',
                border: 'none',
                borderRadius: 20,
                width: 40,
                height: 40,
                cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
