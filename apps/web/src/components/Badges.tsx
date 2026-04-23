import React from 'react';
import type { SenseTransmitPhase, RecognizeRequestPhase } from '@cs/domain';

type Phase = SenseTransmitPhase | RecognizeRequestPhase;

const CLASS: Record<string, string> = {
  Sense: 'phase-sense',
  Transmit: 'phase-transmit',
  Analyze: 'phase-analyze',
  React: 'phase-react',
  Repeat: 'phase-repeat',
  Recognize: 'phase-analyze',
  Request: 'phase-transmit',
  Respond: 'phase-react',
};

export function LoopPhasePill({ phase }: { phase: Phase }) {
  return <span className={`loop-phase ${CLASS[phase] ?? 'phase-sense'}`}>{phase}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'badge-neutral',
    approved: 'badge-success',
    rejected: 'badge-error',
    implemented: 'badge-cyan',
    archived: 'badge-neutral',
    active: 'badge-success',
    nascent: 'badge-warning',
    developing: 'badge-cyan',
    mature: 'badge-success',
    legacy: 'badge-neutral',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}

export function StrategicFlags({ mapping }: { mapping: { raisesWTP: boolean; reducesCost: boolean; increasesSwitchingCosts: boolean; improvesActivitySystem: boolean; strengthensBusinessModel: boolean } }) {
  const flags = [
    { key: 'raisesWTP', label: '↑ WTP', show: mapping.raisesWTP },
    { key: 'reducesCost', label: '↓ Costo', show: mapping.reducesCost },
    { key: 'increasesSwitchingCosts', label: '🔒 Switching', show: mapping.increasesSwitchingCosts },
    { key: 'improvesActivitySystem', label: '⬡ Activity', show: mapping.improvesActivitySystem },
    { key: 'strengthensBusinessModel', label: '◈ BM', show: mapping.strengthensBusinessModel },
  ].filter(f => f.show);
  return (
    <div className="proposal-flags">
      {flags.map(f => <span key={f.key} className="badge badge-violet">{f.label}</span>)}
    </div>
  );
}
