import React from 'react';
import { useNavigate } from 'react-router-dom';

export function QuickStartPage() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: '⚙️',
      title: 'Configura tu API Key',
      desc: 'Habilita el poder de IA añadiendo tu Gemini API Key.',
      action: 'Ir a Configuración',
      to: '/settings'
    },
    {
      icon: '⚡',
      title: 'Escanea tus proyectos',
      desc: 'Analiza tu código fuente y crea el perfil inicial de tu negocio.',
      action: 'Ir a Launcher',
      to: '/launcher'
    },
    {
      icon: '✎',
      title: 'Completa los Worksheets',
      desc: 'Define el dolor del cliente, la propuesta de valor y tu estrategia conectada.',
      action: 'Ver Worksheets',
      to: '/worksheets'
    },
    {
      icon: '🚀',
      title: 'Lanza el Swarm V3',
      desc: 'Activa 15 agentes simultáneos para evaluar tu readiness y generar propuestas.',
      action: 'Ir a V3 Analysis',
      to: '/v3'
    },
    {
      icon: '📋',
      title: 'Revisa el Briefing',
      desc: 'Obtén el reporte consolidado de tu plataforma con los Action Items priorizados.',
      action: 'Ver Briefing',
      to: '/briefing'
    }
  ];

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <header className="page-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 className="page-title">Guía de Inicio Rápido</h1>
        <p className="page-subtitle">Sigue estos 5 pasos para obtener el máximo valor de Connected Strategy</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((step, index) => (
          <div key={index} style={{
            background: 'var(--cs-surface)',
            border: '1px solid var(--cs-border)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => navigate(step.to)}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: 'var(--cs-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flexShrink: 0,
              border: '1px solid var(--cs-border)'
            }}>
              {step.icon}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--cs-primary)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em' }}>
                PASO {index + 1}
              </div>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--cs-text)', marginBottom: 4 }}>
                {step.title}
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--cs-text-muted)' }}>
                {step.desc}
              </p>
            </div>

            <button style={{
              background: 'var(--cs-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              {step.action} &rarr;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
