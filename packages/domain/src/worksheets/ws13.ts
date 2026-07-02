/**
 * @cs/domain — worksheets/ws13.ts
 * Canonical worksheet definition for WS13.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS13:Connected Strategy Matrix 5×4 ─────────────────────────────────────
export const WS13_STRATEGY_MATRIX: WorksheetDefinition = {
  id: 'ws13_strategy_matrix',
  title: 'WS13 — Matriz de Estrategia Conectada (5×4)',
  description:
    'Matriz que cruza 4 Experiencias Conectadas (Responder al Deseo, Oferta Curada, Coach de Comportamiento, Ejecución Automática) ' +
    'con 5 Arquitecturas de Conexión (Productor, Retailer, Market Maker, Crowd Orchestrator, Red P2P). ' +
    'Las celdas vacías son oportunidades de innovación. ' +
    'Fuente: Workshop 3 Steps 1-2, Capítulo 7 Fig. 7-6.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'current_position',
      title: 'Posición Actual',
      description: 'Marca en qué celdas de la matriz operas tú y tus competidores.',
      questions: [
        { id: 'sm_own_experiences', text: '¿Qué experiencias conectadas ofreces? (selecciona todas)', type: 'multi-choice', options: ['Respond-to-Desire', 'Curated Offering', 'Coach Behavior', 'Automatic Execution'], required: true },
        { id: 'sm_own_architectures', text: '¿Qué arquitecturas de conexión usas?', type: 'multi-choice', options: ['Connected Producer', 'Connected Retailer', 'Connected Market Maker', 'Crowd Orchestrator', 'P2P Network Creator'], required: true },
        { id: 'sm_competitor_positions', text: 'Describe dónde están tus competidores en la matriz (ej: "Uber = Respond-to-Desire + Crowd Orchestrator")', type: 'text', required: false },
      ],
    },
    {
      id: 'innovation_opportunities',
      title: 'Oportunidades de Innovación',
      description: 'Para cada celda vacía pregúntate: ¿Qué pasaría si operáramos aquí?',
      questions: [
        { id: 'sm_empty_cells', text: '¿Qué celdas están vacías en tu industria? (oportunidades)', type: 'text', required: false },
        { id: 'sm_what_if', text: 'Si entraras en una celda nueva, ¿qué servicio ofrecerías?', type: 'text', required: false },
        { id: 'sm_required_connections', text: '¿Qué nuevas conexiones necesitarías crear?', type: 'text', required: false },
        { id: 'sm_revenue_implications', text: '¿Cómo cambiaría tu modelo de ingresos?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-23T00:00:00Z',
  updatedAt: '2026-04-23T00:00:00Z',
};
