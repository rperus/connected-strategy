import React from 'react';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        background: 'var(--cs-accent)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {message}
    </div>
  );
}
