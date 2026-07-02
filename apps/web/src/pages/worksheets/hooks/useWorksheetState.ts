import { useState, useEffect, useCallback, useRef } from 'react';
import { ALL_WORKSHEETS } from '@cs/domain';
import type { WorksheetDefinition, WorksheetAnswer } from '@cs/domain';
import { api } from '../../../config';
import { MOCK_PROJECTS } from '../../../mockData';
import type { StorageMode } from '../components/StorageBadge';

const LS_KEY = 'cs_worksheet_answers';
const LS_PROJECT_KEY = 'cs_active_project_id';

function lsLoad(): Record<string, Record<string, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function lsSave(all: Record<string, Record<string, unknown>>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* quota exceeded — silent */
  }
}

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

export function completionPct(ws: WorksheetDefinition, answers: Record<string, unknown>): number {
  const all = ws.sections.flatMap((s) => s.questions);
  const answered = all.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== '',
  ).length;
  return Math.round((answered / Math.max(all.length, 1)) * 100);
}

export function useWorksheetState() {
  const defaultProjectId =
    localStorage.getItem(LS_PROJECT_KEY) ?? MOCK_PROJECTS[0]?.id ?? 'connected-strategy';

  const [projectId, setProjectId] = useState<string>(defaultProjectId);
  const [selected, setSelected] = useState<WorksheetDefinition>(ALL_WORKSHEETS[0]);
  const [allAnswers, setAllAnswers] = useState<Record<string, Record<string, unknown>>>(lsLoad);
  const [storageMode, setStorageMode] = useState<StorageMode>('loading');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState<Record<string, boolean>>({});
  const [hasAutoFilled, setHasAutoFilled] = useState<Record<string, boolean>>({});
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableProjects = MOCK_PROJECTS.map((p) => ({ id: p.id, name: p.name }));

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  // Load answers from API on mount or when projectId changes
  useEffect(() => {
    let cancelled = false;
    setStorageMode('loading');

    fetchAnswersFromApi(projectId).then((apiAnswers) => {
      if (cancelled) return;

      if (apiAnswers !== null) {
        const lsData = lsLoad();
        const merged: Record<string, Record<string, unknown>> = { ...lsData };
        for (const [wsId, wsAnswers] of Object.entries(apiAnswers)) {
          merged[wsId] = wsAnswers;
        }
        setAllAnswers(merged);
        lsSave(merged);
        setStorageMode('sqlite');
      } else {
        setAllAnswers(lsLoad());
        setStorageMode('localstorage');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Persist project selection
  useEffect(() => {
    localStorage.setItem(LS_PROJECT_KEY, projectId);
  }, [projectId]);

  // Answer change: update local state + localStorage + debounced auto-save
  const setAnswer = useCallback((qId: string, val: unknown) => {
    setAllAnswers((prev) => {
      const next = {
        ...prev,
        [selected.id]: { ...(prev[selected.id] ?? {}), [qId]: val },
      };
      lsSave(next);

      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(async () => {
        const ok = await putAnswerToApi(projectId, selected.id, next[selected.id] ?? {});
        if (ok) setStorageMode('sqlite');
      }, 1500);

      return next;
    });
  }, [selected.id, projectId]);

  // Zero-UI Autofill action
  const handleAutofill = useCallback(async (ws: WorksheetDefinition) => {
    const wsAnswers = allAnswers[ws.id] ?? {};
    setAutofilling((prev) => ({ ...prev, [ws.id]: true }));
    try {
      const questions = ws.sections.flatMap((s) => s.questions.map((q) => q.text));
      const res = await fetch(api.worksheetAutofill(projectId, ws.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      const data = await res.json();

      if (data.ok && data.data) {
        const newAnswers: Record<string, unknown> = { ...wsAnswers };
        ws.sections.forEach((s) => {
          s.questions.forEach((q) => {
            const agentAnswer = data.data[q.text];
            if (agentAnswer && agentAnswer.value && !agentAnswer.value.includes('Mock answer')) {
              if (!newAnswers[q.id]) {
                newAnswers[q.id] = agentAnswer.value;
              }
            }
          });
        });

        setAllAnswers((prev) => {
          const next = { ...prev, [ws.id]: newAnswers };
          lsSave(next);
          return next;
        });

        await putAnswerToApi(projectId, ws.id, newAnswers);
        showToast('🌟 Autocompletado Zero-UI con IA completado');
        setStorageMode('sqlite');
      }
    } catch (e) {
      console.warn('Autofill failed:', e);
    } finally {
      setAutofilling((prev) => ({ ...prev, [ws.id]: false }));
    }
  }, [projectId, allAnswers, showToast]);

  // Trigger Zero-UI autofill if worksheet is empty and storage mode is loaded
  useEffect(() => {
    const isReady = storageMode !== 'loading';
    const isEmpty = completionPct(selected, allAnswers[selected.id] ?? {}) === 0;
    const isFilling = autofilling[selected.id];
    const hasFilled = hasAutoFilled[selected.id];

    if (isReady && isEmpty && !isFilling && !hasFilled) {
      setHasAutoFilled((prev) => ({ ...prev, [selected.id]: true }));
      handleAutofill(selected);
    }
  }, [selected, storageMode, allAnswers, autofilling, hasAutoFilled, handleAutofill]);

  // Explicit Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    const wsAnswers = allAnswers[selected.id] ?? {};
    lsSave(allAnswers);
    const ok = await putAnswerToApi(projectId, selected.id, wsAnswers);
    setSaving(false);

    if (ok) {
      setStorageMode('sqlite');
      showToast('✓ Guardado en SQLite');
    } else {
      setStorageMode('localstorage');
      showToast('⚠ Guardado en localStorage (API no disponible)');
    }
  }, [selected.id, projectId, allAnswers, showToast]);

  // Clear answers
  const handleClear = useCallback(async () => {
    setAllAnswers((prev) => {
      const next = { ...prev };
      delete next[selected.id];
      lsSave(next);
      return next;
    });

    try {
      await fetch(api.worksheetAnswer(projectId, selected.id), { method: 'DELETE' });
    } catch {
      /* ignore */
    }

    showToast('Respuestas borradas');
  }, [selected.id, projectId, showToast]);

  // Save all worksheets
  const handleSaveAll = useCallback(async () => {
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
  }, [projectId, allAnswers, showToast]);

  const selectedAnswers = allAnswers[selected.id] ?? {};
  const pct = completionPct(selected, selectedAnswers);
  const totalAnswered = ALL_WORKSHEETS.filter(
    (ws) => completionPct(ws, allAnswers[ws.id] ?? {}) > 0,
  ).length;

  return {
    projectId,
    setProjectId,
    selectedWorksheet: selected,
    setSelectedWorksheet: setSelected,
    allAnswers,
    selectedAnswers,
    setAnswer,
    storageMode,
    toast,
    saving,
    autofilling,
    handleSave,
    handleClear,
    handleSaveAll,
    handleAutofill,
    availableProjects,
    pct,
    totalAnswered,
  };
}
