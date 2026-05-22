import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
  primary?: boolean;
}

interface EmptyStateProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      background: 'var(--cs-surface-glass)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--cs-border)',
      boxShadow: 'var(--shadow-sm)',
      margin: '24px auto',
      maxWidth: 480
    }}>
      <div style={{ 
        fontSize: 48, 
        marginBottom: 20, 
        opacity: 0.8,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' 
      }}>
        {icon}
      </div>
      <h3 style={{ 
        fontFamily: 'var(--font-display)', 
        fontSize: 18, 
        fontWeight: 700, 
        color: 'var(--cs-text)', 
        marginBottom: 8,
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: 13, 
        color: 'var(--cs-text-muted)', 
        lineHeight: 1.6, 
        marginBottom: action ? 24 : 0 
      }}>
        {description}
      </p>
      
      {action && (
        action.to ? (
          <Link 
            to={action.to} 
            className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textDecoration: 'none' }}
          >
            {action.label}
          </Link>
        ) : (
          <button 
            onClick={action.onClick} 
            className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
