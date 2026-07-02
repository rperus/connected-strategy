/**
 * @cs/domain — worksheets.ts
 *
 * Canonical worksheet definitions for all 15 Connected Strategy worksheets
 * based on Wharton curriculum (WS01–WS15).
 *
 * Exposes all definitions and helper functions while loading modular definitions
 * from individual files.
 */

import type { WorksheetDefinition } from './types.js';

import { WS01_PROBLEM_ACTORS } from './worksheets/ws01.js';
import { WS02_CONNECTED_LOOP } from './worksheets/ws02.js';
import { WS03_SWITCHING_COSTS } from './worksheets/ws03.js';
import { WS04_MVP } from './worksheets/ws04.js';
import { WS05_CANONICAL_DATA } from './worksheets/ws05.js';
import { WS06_CLOSED_LOOP } from './worksheets/ws06.js';
import { WS07_AGENT_DESIGN } from './worksheets/ws07.js';
import { WS08_DASHBOARDS } from './worksheets/ws08.js';
import { WS09_COMPLIANCE } from './worksheets/ws09.js';
import { WS10_COMPETITIVE } from './worksheets/ws10.js';
import { WS11_GTM } from './worksheets/ws11.js';
import { WS12_EFFICIENCY_FRONTIER } from './worksheets/ws12.js';
import { WS13_STRATEGY_MATRIX } from './worksheets/ws13.js';
import { WS14_STAR_DECONSTRUCTION } from './worksheets/ws14.js';
import { WS15_FIVE_FORCES } from './worksheets/ws15.js';

export {
  WS01_PROBLEM_ACTORS,
  WS02_CONNECTED_LOOP,
  WS03_SWITCHING_COSTS,
  WS04_MVP,
  WS05_CANONICAL_DATA,
  WS06_CLOSED_LOOP,
  WS07_AGENT_DESIGN,
  WS08_DASHBOARDS,
  WS09_COMPLIANCE,
  WS10_COMPETITIVE,
  WS11_GTM,
  WS12_EFFICIENCY_FRONTIER,
  WS13_STRATEGY_MATRIX,
  WS14_STAR_DECONSTRUCTION,
  WS15_FIVE_FORCES,
};

export const ALL_WORKSHEETS: WorksheetDefinition[] = [
  WS01_PROBLEM_ACTORS,
  WS02_CONNECTED_LOOP,
  WS03_SWITCHING_COSTS,
  WS04_MVP,
  WS05_CANONICAL_DATA,
  WS06_CLOSED_LOOP,
  WS07_AGENT_DESIGN,
  WS08_DASHBOARDS,
  WS09_COMPLIANCE,
  WS10_COMPETITIVE,
  WS11_GTM,
  WS12_EFFICIENCY_FRONTIER,
  WS13_STRATEGY_MATRIX,
  WS14_STAR_DECONSTRUCTION,
  WS15_FIVE_FORCES,
];

export function getWorksheetById(id: string): WorksheetDefinition | undefined {
  return ALL_WORKSHEETS.find((ws) => ws.id === id);
}

/** Return all question IDs across all worksheets */
export function getAllQuestionIds(): string[] {
  return ALL_WORKSHEETS.flatMap((ws) =>
    ws.sections.flatMap((s) => s.questions.map((q) => q.id)),
  );
}

/** Return scoring-relevant questions (those with a weight) */
export function getScoringQuestions(): Array<{ worksheetId: string; questionId: string; weight: number }> {
  const result: Array<{ worksheetId: string; questionId: string; weight: number }> = [];
  for (const ws of ALL_WORKSHEETS) {
    for (const section of ws.sections) {
      for (const q of section.questions) {
        if (q.weight !== undefined) {
          result.push({ worksheetId: ws.id, questionId: q.id, weight: q.weight });
        }
      }
    }
  }
  return result;
}
