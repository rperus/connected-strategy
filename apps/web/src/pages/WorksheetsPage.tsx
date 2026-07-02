/**
 * WorksheetsPage — WS01-WS15 editor with SQLite persistence via API.
 *
 * Refactored to separate rendering from hook states and layout components.
 */
import React from 'react';
import { ALL_WORKSHEETS } from '@cs/domain';
import { LoopPhasePill } from '../components/Badges';
import { ProjectSelector } from './worksheets/components/ProjectSelector';
import { StorageBadge } from './worksheets/components/StorageBadge';
import { Toast } from './worksheets/components/Toast';
import { useWorksheetState, completionPct } from './worksheets/hooks/useWorksheetState';

export function WorksheetsPage() {
  const {
    projectId,
    setProjectId,
    selectedWorksheet,
    setSelectedWorksheet,
    allAnswers,
    selectedAnswers,
    setAnswer,
    storageMode,
    toast,
    saving,
    autofilling,
    handleClear,
    handleSaveAll,
    handleAutofill,
    availableProjects,
    pct,
    totalAnswered,
  } = useWorksheetState();

  return (
    <div
      className="page-container"
      style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}
    >
      {/* ── Left: worksheet list ─── */}
      <div>
        {/* Project selector + storage badge */}
        <div style={{ marginBottom: 4 }}>
          <ProjectSelector
            projectId={projectId}
            onChange={setProjectId}
            availableProjects={availableProjects}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <StorageBadge mode={storageMode} />
            <span style={{ fontSize: 11, color: 'var(--cs-text-dim)' }}>
              {totalAnswered}/15 worksheets con datos
            </span>
          </div>
        </div>

        <div className="section-title">WS01 – WS15</div>
        <div className="ws-list">
          {ALL_WORKSHEETS.map((ws) => {
            const wsPct = completionPct(ws, allAnswers[ws.id] ?? {});
            return (
              <div
                key={ws.id}
                className={`ws-item${selectedWorksheet.id === ws.id ? ' ws-active' : ''}`}
                onClick={() => setSelectedWorksheet(ws)}
              >
                <div>
                  <div className="ws-item-title">{ws.title}</div>
                  <div className="ws-item-desc">{wsPct}% completado</div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      wsPct === 100
                        ? '#22c55e'
                        : wsPct > 0
                          ? '#f59e0b'
                          : 'var(--cs-text-dim)',
                  }}
                >
                  {wsPct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Save all */}
        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSaveAll}
            disabled={saving}
            style={{ width: '100%' }}
          >
            {saving ? 'Guardando…' : '↑ Guardar todo'}
          </button>
        </div>
      </div>

      {/* ── Right: editor ─── */}
      <div className="ws-editor">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}
        >
          <div className="ws-editor-title">{selectedWorksheet.title}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <StorageBadge mode={storageMode} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color:
                  pct === 100 ? '#22c55e' : pct > 0 ? '#f59e0b' : 'var(--cs-text-dim)',
              }}
            >
              {pct}%
            </span>
          </div>
        </div>
        <div className="ws-editor-desc" style={{ marginBottom: 20 }}>
          {selectedWorksheet.description}
        </div>

        {selectedWorksheet.sections.map((sec) => (
          <div key={sec.id} className="ws-section">
            <div className="ws-section-title">{sec.title}</div>
            {sec.questions.map((q) => (
              <div key={q.id} className="ws-question">
                <div className="ws-question-label">
                  {q.text}
                  {q.required && <span className="ws-required">*</span>}
                  {q.loopPhase && <LoopPhasePill phase={q.loopPhase} />}
                </div>

                {q.type === 'text' && (
                  <textarea
                    className="ws-textarea"
                    value={(selectedAnswers[q.id] as string) ?? ''}
                    placeholder={
                      autofilling[selectedWorksheet.id]
                        ? '✨ Analizando Wharton knowledge base...'
                        : 'Tu respuesta...'
                    }
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    disabled={autofilling[selectedWorksheet.id]}
                    style={
                      autofilling[selectedWorksheet.id]
                        ? { opacity: 0.7, background: 'var(--cs-surface-hover)' }
                        : {}
                    }
                  />
                )}

                {q.type === 'number' && (
                  <input
                    className="ws-input"
                    type="number"
                    value={(selectedAnswers[q.id] as string) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'scale' && (
                  <div className="ws-scale-wrap">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(selectedAnswers[q.id] as number) ?? 50}
                      onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                    />
                    <span className="ws-scale-val">{(selectedAnswers[q.id] as number) ?? 50}</span>
                  </div>
                )}

                {q.type === 'boolean' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Sí', 'No'].map((opt) => (
                      <button
                        key={opt}
                        className={`btn btn-sm ${selectedAnswers[q.id] === opt ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setAnswer(q.id, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {(q.type === 'choice' || q.type === 'multi-choice') && q.options && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {q.options.map((opt) => {
                      const sel =
                        q.type === 'multi-choice'
                          ? ((selectedAnswers[q.id] as string[]) ?? []).includes(opt)
                          : selectedAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          className={`btn btn-sm ${sel ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            if (q.type === 'multi-choice') {
                              const cur = (selectedAnswers[q.id] as string[]) ?? [];
                              setAnswer(q.id, sel ? cur.filter((x) => x !== opt) : [...cur, opt]);
                            } else {
                              setAnswer(q.id, opt);
                            }
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Action bar */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            paddingTop: 16,
            borderTop: '1px solid var(--cs-border)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => handleAutofill(selectedWorksheet)}
            disabled={autofilling[selectedWorksheet.id]}
          >
            {autofilling[selectedWorksheet.id] ? '✨ Autocompletando...' : '🌟 Autocompletar con IA'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={autofilling[selectedWorksheet.id]}
          >
            Limpiar
          </button>
          <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', alignSelf: 'center' }}>
            {pct}% completado · {storageMode === 'sqlite' ? 'SQLite' : 'localStorage'}
          </div>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
