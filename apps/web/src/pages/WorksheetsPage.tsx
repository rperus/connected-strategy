/**
 * WorksheetsPage — WS01-WS11 editor with SQLite persistence via API.
 *
 * Priority:
 *   1. Load answers from GET /api/worksheets/:projectId on mount
 *   2. Save via PUT /api/worksheets/:projectId/:worksheetId on explicit save
 *   3. Answer changes auto-persist to localStorage as fallback cache
 *   4. If API call fails, fall back silently to localStorage-only mode
 *
 * Status badges show "SQLite ✓" or "localStorage" to make storage mode clear.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { ALL_WORKSHEETS } from '@cs/domain';
import type { WorksheetDefinition, WorksheetAnswer } from '@cs/domain';
import { LoopPhasePill } from '../components/Badges';
import { api } from '../config';
import { MOCK_PROJECTS } from '../mockData';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const LS_KEY = 'cs_worksheet_answers';
const LS_PROJECT_KEY = 'cs_active_project_id';

// ─── LocalStorage helpers (fallback layer) ────────────────────────────────────

function lsLoad(): Record<string, Record<string, unknown>> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); }
  catch { return {}; }
}

function lsSave(all: Record<string, Record<string, unknown>>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); }
  catch { /* quota exceeded — silent */ }
}

// ─── API helpers ──────────────────────────────────────────────────────────────

interface ApiWorksheetAnswer {
  worksheetId: string;
  projectId: string;
  version: number;
  answers: Record<string, unknown>;
  confidence: Record<string, string>;
  updatedAt: string;
}

interface ApiListResponse {
  ok: boolean;
  data: ApiWorksheetAnswer[];
}

async function fetchAnswersFromApi(
  projectId: string,
): Promise<Record<string, Record<string, unknown>> | null> {
  try {
    const res = await fetch(api.worksheetsByProject(projectId));
    if (!res.ok) return null;
    const body: ApiListResponse = await res.json();
    if (!body.ok || !Array.isArray(body.data)) return null;
    // Convert array to map: worksheetId → answers
    const map: Record<string, Record<string, unknown>> = {};
    for (const item of body.data) {
      map[item.worksheetId] = item.answers;
    }
    return map;
  } catch {
    return null;
  }
}

async function putAnswerToApi(
  projectId: string,
  worksheetId: string,
  answers: Record<string, unknown>,
): Promise<boolean> {
  try {
    const payload: Omit<WorksheetAnswer, 'id'> = {
      worksheetId,
      projectId,
      version: 1,
      answers,
      confidence: {},
      updatedAt: new Date().toISOString(),
    };
    const res = await fetch(api.worksheetAnswer(projectId, worksheetId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Completion helper ────────────────────────────────────────────────────────

function completionPct(ws: WorksheetDefinition, answers: Record<string, unknown>): number {
  const all = ws.sections.flatMap((s) => s.questions);
  const answered = all.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== '',
  ).length;
  return Math.round((answered / Math.max(all.length, 1)) * 100);
}

// ─── Project selector component ───────────────────────────────────────────────

interface ProjectSelectorProps {
  projectId: string;
  onChange: (id: string) => void;
  availableProjects: Array<{ id: string; name: string }>;
}

function ProjectSelector({ projectId, onChange, availableProjects }: ProjectSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <span style={{ fontSize: 12, color: 'var(--cs-text-muted)', whiteSpace: 'nowrap' }}>Proyecto:</span>
      <select
        value={projectId}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'var(--cs-surface)',
          color: 'var(--cs-text)',
          border: '1px solid var(--cs-border)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {availableProjects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Storage mode badge ───────────────────────────────────────────────────────

type StorageMode = 'loading' | 'sqlite' | 'localstorage';

function StorageBadge({ mode }: { mode: StorageMode }) {
  if (mode === 'loading') {
    return <span className="badge badge-cyan">Cargando…</span>;
  }
  if (mode === 'sqlite') {
    return <span className="badge badge-success">SQLite ✓</span>;
  }
  return <span className="badge badge-warning">localStorage</span>;
}

// ─── Toast component ──────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
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

// ─── Main component ───────────────────────────────────────────────────────────

export function WorksheetsPage() {
  // Default project: prefer last used from localStorage, then first mock project
  const defaultProjectId =
    localStorage.getItem(LS_PROJECT_KEY) ?? MOCK_PROJECTS[0]?.id ?? 'connected-strategy';

  const [projectId, setProjectId] = useState<string>(defaultProjectId);
  const [selected, setSelected] = useState<WorksheetDefinition>(ALL_WORKSHEETS[0]);
  const [allAnswers, setAllAnswers] = useState<Record<string, Record<string, unknown>>>(lsLoad);
  const [storageMode, setStorageMode] = useState<StorageMode>('loading');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build available project list (mock + any scanned projects added dynamically)
  const availableProjects = MOCK_PROJECTS.map((p) => ({ id: p.id, name: p.name }));

  // ── Load answers from API on mount or when projectId changes ─────────────
  useEffect(() => {
    let cancelled = false;
    setStorageMode('loading');

    fetchAnswersFromApi(projectId).then((apiAnswers) => {
      if (cancelled) return;

      if (apiAnswers !== null) {
        // API data: merge with LS fallback (API wins for keys present in API)
        const lsData = lsLoad();
        const merged: Record<string, Record<string, unknown>> = { ...lsData };
        for (const [wsId, wsAnswers] of Object.entries(apiAnswers)) {
          merged[wsId] = wsAnswers;
        }
        setAllAnswers(merged);
        // Also write merged back to localStorage as local cache
        lsSave(merged);
        setStorageMode('sqlite');
      } else {
        // API unavailable — use localStorage fallback
        setAllAnswers(lsLoad());
        setStorageMode('localstorage');
      }
    });

    return () => { cancelled = true; };
  }, [projectId]);

  // ── Persist project selection ─────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_PROJECT_KEY, projectId);
  }, [projectId]);

  // ── Show toast helper ─────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Answer change: update local state + localStorage + debounced auto-save ──
  function setAnswer(qId: string, val: unknown) {
    setAllAnswers((prev) => {
      const next = {
        ...prev,
        [selected.id]: { ...(prev[selected.id] ?? {}), [qId]: val },
      };
      // Persist to localStorage immediately as offline cache
      lsSave(next);

      // W2-4: Debounced auto-save to API (1500ms after last keystroke)
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(async () => {
        const ok = await putAnswerToApi(projectId, selected.id, next[selected.id] ?? {});
        if (ok) setStorageMode('sqlite');
      }, 1500);

      return next;
    });
  }

  // ── Explicit save: PUT to API + update localStorage ───────────────────────
  async function handleSave() {
    setSaving(true);
    const wsAnswers = allAnswers[selected.id] ?? {};

    // Always write to localStorage first
    lsSave(allAnswers);

    // Try API
    const ok = await putAnswerToApi(projectId, selected.id, wsAnswers);

    setSaving(false);

    if (ok) {
      setStorageMode('sqlite');
      showToast('✓ Guardado en SQLite');
    } else {
      setStorageMode('localstorage');
      showToast('⚠ Guardado en localStorage (API no disponible)');
    }
  }

  // ── Clear current worksheet answers ──────────────────────────────────────
  async function handleClear() {
    setAllAnswers((prev) => {
      const next = { ...prev };
      delete next[selected.id];
      lsSave(next);
      return next;
    });

    // Optionally DELETE from API too
    try {
      await fetch(api.worksheetAnswer(projectId, selected.id), { method: 'DELETE' });
    } catch { /* ignore */ }

    showToast('Respuestas borradas');
  }

  // ── Save all worksheets at once ───────────────────────────────────────────
  async function handleSaveAll() {
    setSaving(true);
    lsSave(allAnswers);

    let successCount = 0;
    const entries = Object.entries(allAnswers);
    for (const [wsId, wsAnswers] of entries) {
      const ok = await putAnswerToApi(projectId, wsId, wsAnswers);
      if (ok) successCount++;
    }

    setSaving(false);

    if (successCount === entries.length && entries.length > 0) {
      setStorageMode('sqlite');
      showToast(`✓ ${successCount} worksheets guardados en SQLite`);
    } else if (successCount > 0) {
      setStorageMode('sqlite');
      showToast(`✓ ${successCount}/${entries.length} guardados en SQLite`);
    } else {
      setStorageMode('localstorage');
      showToast('⚠ Guardado solo en localStorage');
    }
  }

  const answers = allAnswers[selected.id] ?? {};
  const pct = completionPct(selected, answers);
  const totalAnswered = ALL_WORKSHEETS.filter(
    (ws) => completionPct(ws, allAnswers[ws.id] ?? {}) > 0,
  ).length;

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
              {totalAnswered}/11 worksheets con datos
            </span>
          </div>
        </div>

        <div className="section-title">WS01 – WS11</div>
        <div className="ws-list">
          {ALL_WORKSHEETS.map((ws) => {
            const wsPct = completionPct(ws, allAnswers[ws.id] ?? {});
            return (
              <div
                key={ws.id}
                className={`ws-item${selected.id === ws.id ? ' ws-active' : ''}`}
                onClick={() => setSelected(ws)}
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
          <div className="ws-editor-title">{selected.title}</div>
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
          {selected.description}
        </div>

        {selected.sections.map((sec) => (
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
                    value={(answers[q.id] as string) ?? ''}
                    placeholder="Tu respuesta..."
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'number' && (
                  <input
                    className="ws-input"
                    type="number"
                    value={(answers[q.id] as string) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'scale' && (
                  <div className="ws-scale-wrap">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(answers[q.id] as number) ?? 50}
                      onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                    />
                    <span className="ws-scale-val">{(answers[q.id] as number) ?? 50}</span>
                  </div>
                )}

                {q.type === 'boolean' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Sí', 'No'].map((opt) => (
                      <button
                        key={opt}
                        className={`btn btn-sm ${answers[q.id] === opt ? 'btn-primary' : 'btn-secondary'}`}
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
                          ? ((answers[q.id] as string[]) ?? []).includes(opt)
                          : answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          className={`btn btn-sm ${sel ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            if (q.type === 'multi-choice') {
                              const cur = (answers[q.id] as string[]) ?? [];
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

          <button className="btn btn-secondary" onClick={handleClear}>
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
