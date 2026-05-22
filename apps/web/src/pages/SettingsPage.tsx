import React, { useState, useEffect } from 'react';
import { api } from '../config';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success' | '', text: string }>({ type: '', text: '' });
  
  useEffect(() => {
    fetch(api.settings)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.settings) {
          setHasKey(data.settings.hasKey);
          setMaskedKey(data.settings.maskedKey);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setStatusMsg({ type: '', text: '' });
    
    // Primero, validar la clave si no está vacía
    if (apiKey.trim() !== '') {
      setIsValidating(true);
      try {
        const validateRes = await fetch(api.settingsValidateKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: apiKey.trim() })
        });
        const validateData = await validateRes.json();
        
        if (!validateData.valid) {
          setStatusMsg({ type: 'error', text: 'Error de validación: ' + (validateData.error || 'Clave inválida') });
          setIsValidating(false);
          return;
        }
      } catch (e: any) {
        setStatusMsg({ type: 'error', text: 'Error conectando con servidor de validación' });
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }
    
    // Guardar si es válida o si está vacía (para borrarla)
    try {
      const res = await fetch(api.settings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: apiKey.trim() })
      });
      const data = await res.json();
      
      if (data.ok) {
        setStatusMsg({ type: 'success', text: 'Configuración guardada correctamente.' });
        if (apiKey.trim() !== '') {
          setHasKey(true);
          setMaskedKey(apiKey.trim().substring(0, 4) + '...' + apiKey.trim().substring(apiKey.trim().length - 4));
        } else {
          setHasKey(false);
          setMaskedKey('');
        }
        setApiKey(''); // Limpiar el input
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Error al guardar configuración' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Error conectando con el servidor' });
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <header className="page-header" style={{ marginBottom: 40 }}>
        <h1 className="page-title">Configuración</h1>
        <p className="page-subtitle">Ajustes globales de la plataforma Connected Strategy</p>
      </header>

      <section style={{
        background: 'var(--cs-surface)',
        border: '1px solid var(--cs-border)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 24 }}>🧠</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--cs-text)', margin: 0 }}>
            Inteligencia Artificial (Gemini)
          </h2>
        </div>
        
        <p style={{ color: 'var(--cs-text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Connected Strategy funciona en "modo determinístico" por defecto. Para habilitar el Copilot, los reportes automáticos y el agente de orquestación autónomo, necesitas proveer tu propia API Key de Google Gemini. Tu clave se guarda de forma segura en la base de datos local SQLite.
        </p>

        <div style={{
          padding: '16px 20px',
          background: 'var(--cs-bg)',
          borderRadius: 8,
          border: '1px solid var(--cs-border)',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cs-text)' }}>Estado Actual</span>
            {hasKey ? (
              <span style={{ fontSize: 12, color: 'var(--cs-success)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cs-success)' }}></span>
                Conectado ({maskedKey})
              </span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--cs-warning)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cs-warning)' }}></span>
                Modo Determinístico (Sin IA)
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--cs-text)' }}>Google Gemini API Key</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="password"
              placeholder={hasKey ? "Escribe una nueva clave para reemplazarla..." : "AIzaSy..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--cs-bg)',
                border: '1px solid var(--cs-border)',
                borderRadius: 8,
                padding: '10px 16px',
                color: 'var(--cs-text)',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleSave}
              disabled={isValidating}
              style={{
                background: 'var(--cs-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '0 24px',
                fontWeight: 600,
                cursor: isValidating ? 'wait' : 'pointer',
                opacity: isValidating ? 0.7 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {isValidating ? 'Validando...' : 'Guardar y Validar'}
            </button>
          </div>
          <span style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>
            Obtén tu API key gratuita en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--cs-primary)', textDecoration: 'none' }}>Google AI Studio</a>. Deja en blanco y guarda para borrarla.
          </span>
        </div>

        {statusMsg.text && (
          <div style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            fontSize: 14,
            background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            color: statusMsg.type === 'error' ? '#ef4444' : '#22c55e',
            border: `1px solid ${statusMsg.type === 'error' ? '#ef444455' : '#22c55e55'}`
          }}>
            {statusMsg.text}
          </div>
        )}
      </section>
    </div>
  );
}
