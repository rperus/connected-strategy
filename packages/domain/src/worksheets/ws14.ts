/**
 * @cs/domain — worksheets/ws14.ts
 * Canonical worksheet definition for WS14.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS14:STAR Deconstruction ────────────────────────────────────────────────
export const WS14_STAR_DECONSTRUCTION: WorksheetDefinition = {
  id: 'ws14_star_deconstruction',
  title: 'WS14 — Deconstrucción STAR',
  description:
    'Descompone cada subfunción tecnológica en Sense (detectar) / Transmit (enviar) / Analyze (procesar) / React (actuar), ' +
    'cruzado con las 4 fases del viaje del cliente: Recognize / Request / Respond / Repeat. ' +
    'Cada celda identifica la solución actual y oportunidades de mejora tecnológica. ' +
    'Fuente: Workshop 3 Steps 4-5, Capítulo 9 Tabla 9-1.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'sense_phase',
      title: 'SENSE — Detectar',
      description: 'Tecnologías que detectan las necesidades o eventos del cliente (sensores IoT, wearables, reconocimiento de voz, AR).',
      questions: [
        { id: 'star_sense_recognize', text: 'SENSE × RECOGNIZE: ¿Cómo detectas que el cliente tiene una necesidad?', type: 'text', required: true, loopPhase: 'Sense' },
        { id: 'star_sense_request', text: 'SENSE × REQUEST: ¿Cómo el cliente expresa lo que quiere?', type: 'text', required: true, loopPhase: 'Sense' },
        { id: 'star_sense_respond', text: 'SENSE × RESPOND: ¿Cómo detectas que la entrega fue exitosa?', type: 'text', required: false, loopPhase: 'Sense' },
        { id: 'star_sense_repeat', text: 'SENSE × REPEAT: ¿Cómo mides la satisfacción para mejorar?', type: 'text', required: false, loopPhase: 'Sense' },
      ],
    },
    {
      id: 'transmit_phase',
      title: 'TRANSMIT — Enviar',
      description: 'Cómo se envían los datos al sistema (WiFi, 5G, Bluetooth, blockchain).',
      questions: [
        { id: 'star_transmit_recognize', text: 'TRANSMIT × RECOGNIZE: ¿Cómo llegan las señales del cliente a tu sistema?', type: 'text', required: true, loopPhase: 'Transmit' },
        { id: 'star_transmit_request', text: 'TRANSMIT × REQUEST: ¿Cómo se transmite el pedido al proveedor?', type: 'text', required: true, loopPhase: 'Transmit' },
        { id: 'star_transmit_respond', text: 'TRANSMIT × RESPOND: ¿Cómo envías confirmación/resultado al cliente?', type: 'text', required: false, loopPhase: 'Transmit' },
        { id: 'star_transmit_repeat', text: 'TRANSMIT × REPEAT: ¿Cómo compartes datos con socios/ecosistema?', type: 'text', required: false, loopPhase: 'Transmit' },
      ],
    },
    {
      id: 'analyze_phase',
      title: 'ANALYZE — Procesar',
      description: 'Cómo se procesan los datos para generar insights (ML, cloud, analytics).',
      questions: [
        { id: 'star_analyze_recognize', text: 'ANALYZE × RECOGNIZE: ¿Cómo interpretas las señales para identificar la necesidad real?', type: 'text', required: true, loopPhase: 'Analyze' },
        { id: 'star_analyze_request', text: 'ANALYZE × REQUEST: ¿Cómo evalúas las opciones disponibles para el cliente?', type: 'text', required: true, loopPhase: 'Analyze' },
        { id: 'star_analyze_respond', text: 'ANALYZE × RESPOND: ¿Cómo verificas que la respuesta fue correcta?', type: 'text', required: false, loopPhase: 'Analyze' },
        { id: 'star_analyze_repeat', text: 'ANALYZE × REPEAT: ¿Cómo optimizas a nivel de población (no solo individual)?', type: 'text', required: false, loopPhase: 'Analyze' },
      ],
    },
    {
      id: 'react_phase',
      title: 'REACT — Actuar',
      description: 'Cómo se reacciona (IA, automatización, drones, robótica, AR).',
      questions: [
        { id: 'star_react_recognize', text: 'REACT × RECOGNIZE: ¿Cómo alertas al cliente de su necesidad?', type: 'text', required: true, loopPhase: 'React' },
        { id: 'star_react_request', text: 'REACT × REQUEST: ¿Cómo ejecutas el pedido?', type: 'text', required: true, loopPhase: 'React' },
        { id: 'star_react_respond', text: 'REACT × RESPOND: ¿Cómo entregas el producto/servicio?', type: 'text', required: false, loopPhase: 'React' },
        { id: 'star_react_repeat', text: 'REACT × REPEAT: ¿Cómo mejoras el sistema con lo aprendido?', type: 'text', required: false, loopPhase: 'React' },
      ],
    },
  ],
  createdAt: '2026-04-23T00:00:00Z',
  updatedAt: '2026-04-23T00:00:00Z',
};
