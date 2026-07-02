/**
 * @cs/domain — worksheets/ws01.ts
 * Canonical worksheet definition for WS01.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS01:Problem Actors ────────────────────────────────────────────────────
export const WS01_PROBLEM_ACTORS: WorksheetDefinition = {
  id: 'ws01_problem_actors',
  title: 'WS01 — Problem & Actors',
  description:
    'Maps the customer journey, pain points, actors, and information flows. ' +
    'Source: Wharton WS1_Problem_Actors.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'journey',
      title: 'Customer Journey Map',
      description: 'Define the key steps in the primary user journey.',
      questions: [
        { id: 'ws01_journey_steps', text: 'List the main steps a user takes to accomplish their core goal', type: 'text', required: true, loopPhase: 'Sense' },
        { id: 'ws01_actor_roles', text: 'Who are the primary actors in this journey? (end user, operator, partner)', type: 'text', required: true, loopPhase: 'Recognize' },
        { id: 'ws01_trigger', text: 'What triggers the user to start this journey?', type: 'text', required: true, loopPhase: 'Sense' },
      ],
    },
    {
      id: 'pain_points',
      title: 'WTP Drivers & Pain Points',
      questions: [
        { id: 'ws01_expected_value', text: 'What value does the user expect from this journey?', type: 'text', required: true },
        { id: 'ws01_pain_severity', text: 'Overall severity of pain points in the current journey (0=none, 10=critical)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
        { id: 'ws01_redundant_steps', text: 'Which steps are unnecessary or redundant?', type: 'text', required: false, loopPhase: 'Analyze' },
        { id: 'ws01_abandonment_points', text: 'Where do users drop off or give up?', type: 'text', required: false, loopPhase: 'Sense' },
      ],
    },
    {
      id: 'information_flows',
      title: 'Information Flows',
      questions: [
        { id: 'ws01_info_trigger', text: 'What information triggers each key step?', type: 'text', required: true, loopPhase: 'Transmit' },
        { id: 'ws01_info_richness', text: 'Rate the richness of information available at decision points (0=none, 10=full)', type: 'scale', required: true, weight: 0.8, loopPhase: 'Transmit' },
        { id: 'ws01_info_gaps', text: 'What information is missing that would improve decisions?', type: 'text', required: false, loopPhase: 'Analyze' },
      ],
    },
    {
      id: 'why_how',
      title: 'Why-How Ladder',
      questions: [
        { id: 'ws01_deep_why', text: 'What is the deeper reason (beyond the surface request) the user needs this?', type: 'text', required: true },
        { id: 'ws01_how_delivered', text: 'How does the platform currently deliver on that deeper why?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
