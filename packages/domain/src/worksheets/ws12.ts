/**
 * @cs/domain — worksheets/ws12.ts
 * Canonical worksheet definition for WS12.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS12:Efficiency Frontier ────────────────────────────────────────────────
export const WS12_EFFICIENCY_FRONTIER: WorksheetDefinition = {
  id: 'ws12_efficiency_frontier',
  title: 'WS12 — Frontera de Eficiencia',
  description:
    'Gráfica interactiva donde posicionas tu empresa y competidores en ejes WTP (Willingness-to-Pay) vs Costo de Cumplimiento. ' +
    'Muestra quién está en la frontera eficiente y quién está dominado (Pareto). ' +
    'La Ventaja Competitiva se calcula como: CA = (WTP - Cost)_Tú - (WTP - Cost)_Competidor. ' +
    'Fuente: Workshop 1 Step 4 del libro Connected Strategy (Siggelkow & Terwiesch).',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'own_position',
      title: 'Tu Posición',
      description: 'Define los valores de tu empresa. WTP = qué tanto están dispuestos a pagar tus clientes. Cost = cuánto te cuesta cumplir.',
      questions: [
        { id: 'ef_own_name', text: 'Nombre de tu empresa o plataforma', type: 'text', required: true },
        { id: 'ef_own_wtp', text: 'Willingness-to-Pay de tus clientes (0=nada, 100=máximo del mercado)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
        { id: 'ef_own_cost', text: 'Costo de cumplimiento (0=casi gratis, 100=muy caro)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
      ],
    },
    {
      id: 'competitors',
      title: 'Competidores',
      description: 'Agrega hasta 8 competidores con sus valores de WTP y Cost estimados.',
      questions: [
        { id: 'ef_comp_1_name', text: 'Competidor 1: Nombre', type: 'text', required: false },
        { id: 'ef_comp_1_wtp', text: 'Competidor 1: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_1_cost', text: 'Competidor 1: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_2_name', text: 'Competidor 2: Nombre', type: 'text', required: false },
        { id: 'ef_comp_2_wtp', text: 'Competidor 2: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_2_cost', text: 'Competidor 2: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_3_name', text: 'Competidor 3: Nombre', type: 'text', required: false },
        { id: 'ef_comp_3_wtp', text: 'Competidor 3: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_3_cost', text: 'Competidor 3: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_4_name', text: 'Competidor 4: Nombre', type: 'text', required: false },
        { id: 'ef_comp_4_wtp', text: 'Competidor 4: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_4_cost', text: 'Competidor 4: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
      ],
    },
    {
      id: 'frontier_analysis',
      title: 'Análisis de Frontera',
      description: '¿Estás en la frontera eficiente o estás dominado? ¿Hacia dónde debes moverte?',
      questions: [
        { id: 'ef_direction', text: '¿Deberías subir WTP (diferenciación) o bajar Costo (eficiencia)?', type: 'choice', options: ['Subir WTP', 'Bajar Costo', 'Ambos'], required: false },
        { id: 'ef_strategy_notes', text: '¿Qué acciones concretas tomarías para mejorar tu posición en la frontera?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-23T00:00:00Z',
  updatedAt: '2026-04-23T00:00:00Z',
};
