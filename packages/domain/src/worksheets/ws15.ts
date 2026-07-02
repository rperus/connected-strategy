/**
 * @cs/domain — worksheets/ws15.ts
 * Canonical worksheet definition for WS15.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS15:Five Forces (Porter) ───────────────────────────────────────────────
export const WS15_FIVE_FORCES: WorksheetDefinition = {
  id: 'ws15_five_forces',
  title: 'WS15 — 5 Fuerzas de Porter',
  description:
    'Análisis de estructura de la industria: rivalidad, amenaza de entrantes, sustitutos, poder de compradores y proveedores. ' +
    'Fuente: Wharton Competitive Advantage Module 2, Michael Porter.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'forces',
      title: 'Las 5 Fuerzas',
      description: 'Evalúa la intensidad de cada fuerza competitiva en tu industria (0=baja presión, 100=alta presión).',
      questions: [
        { id: 'ff_rivalry', text: 'Rivalidad entre competidores existentes (0=baja, 100=guerra de precios)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_new_entrants', text: 'Amenaza de nuevos entrantes (0=barreras altas, 100=fácil entrar)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_substitutes', text: 'Amenaza de productos sustitutos (0=sin sustitutos, 100=muchos sustitutos)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_buyer_power', text: 'Poder de negociación de compradores (0=fragmentados, 100=concentrados/poderosos)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_supplier_power', text: 'Poder de negociación de proveedores (0=fragmentados, 100=concentrados/poderosos)', type: 'scale', required: true, weight: 1.0 },
      ],
    },
    {
      id: 'analysis',
      title: 'Análisis Estratégico',
      questions: [
        { id: 'ff_attractiveness', text: '¿Qué tan atractiva es tu industria para generar beneficios sostenidos?', type: 'text', required: false },
        { id: 'ff_connected_defense', text: '¿Cómo puede una estrategia conectada reducir la presión de estas fuerzas?', type: 'text', required: false },
        { id: 'ff_key_barrier', text: '¿Cuál es la barrera de entrada más importante en tu industria?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-26T00:00:00Z',
  updatedAt: '2026-04-26T00:00:00Z',
};
