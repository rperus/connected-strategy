import React, { useState, useEffect } from 'react';
import { api } from '../config';
import { MOCK_PROPOSALS } from '../mockData';
import type { ImprovementProposal } from '@cs/domain';

function buildCodexPrompt(p: ImprovementProposal): string {
  return `# Codex Implementation Plan

## Task: ${p.title}

## Context
${p.context}

## Evidence
${p.evidence.map(e => `- ${e}`).join('\n')}

## Expected Impact
${p.expectedImpact}

## Risk
${p.risk} (Level: ${p.riskLevel})

## Acceptance Criteria
${p.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Affected Components
${p.affectedComponents.join(', ')}

## Strategic Mapping
- Raises WTP: ${p.strategicMapping.raisesWTP}
- Reduces Cost: ${p.strategicMapping.reducesCost}
- Increases Switching Costs: ${p.strategicMapping.increasesSwitchingCosts}
- Loop Phase: ${p.strategicMapping.senseTransmitPhase} / ${p.strategicMapping.recognizeRequestPhase}

## Instructions
Generate a detailed implementation plan following the project's architecture.
Include: file list, interfaces, test plan, rollback strategy.
Do NOT start coding until the plan is reviewed.
`;
}

function buildAntigravityPrompt(p: ImprovementProposal): string {
  return `Implement the following improvement for project ${p.projectId}:

TITLE: ${p.title}

CONTEXT: ${p.context}

CHANGE TYPE: ${p.changeType}
COMPONENTS: ${p.affectedComponents.join(', ')}
RISK LEVEL: ${p.riskLevel}

ACCEPTANCE CRITERIA:
${p.acceptanceCriteria.map(c => `- ${c}`).join('\n')}

STRATEGIC FLAGS:
${p.strategicMapping.raisesWTP ? '- Raises WTP\n' : ''}${p.strategicMapping.reducesCost ? '- Reduces Cost\n' : ''}${p.strategicMapping.increasesSwitchingCosts ? '- Increases Switching Costs\n' : ''}
Loop phase: ${p.strategicMapping.senseTransmitPhase}

Make minimal, focused changes. Run typecheck before completing.
`;
}

interface PipelinePrompt {
  projectName: string;
  promptForAntigravity: string;
}

export function PromptPacketsPage() {
  const [expanded, setExpanded] = useState<Record<string, 'codex' | 'antigravity' | null>>({});
  const [toast, setToast] = useState('');
  const [proposals, setProposals] = useState<ImprovementProposal[]>(MOCK_PROPOSALS);
  const [pipelinePrompts, setPipelinePrompts] = useState<PipelinePrompt[]>([]);
  const [source, setSource] = useState<'loading' | 'api' | 'mock'>('loading');

  useEffect(() => {
    Promise.all([
      fetch(api.pipelineProposals).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(api.pipelinePrompts).then(r => r.json()).catch(() => ({ ok: false })),
    ]).then(([propResp, promptResp]) => {
      const propData = (propResp as { ok: boolean; data?: ImprovementProposal[] });
      const promptData = (promptResp as { ok: boolean; data?: PipelinePrompt[] });

      if (propData.ok && propData.data && propData.data.length > 0) {
        setProposals(propData.data);
        setSource('api');
      } else {
        setSource('mock');
      }

      if (promptData.ok && promptData.data) {
        setPipelinePrompts(promptData.data);
      }
    });
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setToast('Copiado al clipboard ✓');
      setTimeout(() => setToast(''), 2000);
    });
  }

  function toggle(id: string, type: 'codex' | 'antigravity') {
    setExpanded(prev => ({ ...prev, [id]: prev[id] === type ? null : type }));
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⟡ Prompt Packets</h1>
        <p className="page-subtitle">
          Genera prompts ejecutables para Codex (plan) y Antigravity (ejecución)
          {source === 'api' && <span className="badge badge-success" style={{ marginLeft: 10 }}>Pipeline real ✓</span>}
          {source === 'mock' && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Demo</span>}
        </p>
      </div>

      {/* Pipeline-generated prompts (from the full pipeline run) */}
      {pipelinePrompts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--cs-text)' }}>
            🚀 Prompts del Pipeline ({pipelinePrompts.length} proyectos)
          </div>
          {pipelinePrompts.map((pkt, i) => (
            <div key={i} className="prompt-packet-card" style={{ marginBottom: 8 }}>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--cs-accent)' }}>
                  {pkt.projectName}
                </summary>
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <pre style={{
                    background: 'var(--cs-bg-secondary)', padding: 12, borderRadius: 6,
                    fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    border: '1px solid var(--cs-border)', maxHeight: 300, overflow: 'auto',
                    color: 'var(--cs-text)',
                  }}>
                    {pkt.promptForAntigravity}
                  </pre>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ position: 'absolute', top: 6, right: 6, fontSize: 10 }}
                    onClick={() => copy(pkt.promptForAntigravity)}
                  >
                    📋 Copiar
                  </button>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* Per-proposal prompts */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--cs-text)' }}>
        📋 Prompts por Propuesta ({proposals.length})
      </div>

      {proposals.map(p => (
        <div key={p.id} className="prompt-packet-card">
          <div className="prompt-packet-title">{p.title}</div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-dim)', marginBottom: 8 }}>
            {p.projectId} · {p.changeType} · {p.riskLevel}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => toggle(p.id, 'codex')}>
              📋 Codex Prompt
            </button>
            <button className="btn btn-violet btn-sm" onClick={() => toggle(p.id, 'antigravity')}>
              ✦ Antigravity Prompt
            </button>
          </div>

          {expanded[p.id] === 'codex' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cs-text-muted)' }}>Codex Plan Prompt</span>
                <button className="btn btn-ghost btn-sm" onClick={() => copy(buildCodexPrompt(p))}>📋 Copiar</button>
              </div>
              <div className="prompt-output">{buildCodexPrompt(p)}</div>
            </div>
          )}

          {expanded[p.id] === 'antigravity' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cs-text-muted)' }}>Antigravity Exec Prompt</span>
                <button className="btn btn-ghost btn-sm" onClick={() => copy(buildAntigravityPrompt(p))}>📋 Copiar</button>
              </div>
              <div className="prompt-output">{buildAntigravityPrompt(p)}</div>
            </div>
          )}
        </div>
      ))}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
