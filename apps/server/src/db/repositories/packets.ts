/**
 * Prompt Packets Repository — SQLite-backed CRUD
 */

import { getDb } from '../index.js';
import type { PromptPacket } from '@cs/prompt-packets';

interface PacketRow {
  id: string;
  proposal_id: string;
  type: string;
  context: string;
  evidence: string;
  objective: string;
  constraints: string;
  affected_files: string;
  acceptance_criteria: string;
  risks: string;
  expected_tests: string;
  markdown: string;
  generated_at: string;
}

function rowToPacket(row: PacketRow): PromptPacket {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    type: row.type as PromptPacket['type'],
    context: row.context,
    evidence: row.evidence,
    objective: row.objective,
    constraints: JSON.parse(row.constraints),
    affectedFiles: JSON.parse(row.affected_files),
    acceptanceCriteria: row.acceptance_criteria,
    risks: JSON.parse(row.risks),
    expectedTests: JSON.parse(row.expected_tests),
    markdown: row.markdown,
    generatedAt: row.generated_at,
  };
}

export function insertPacket(packet: PromptPacket): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO prompt_packets
    (id, proposal_id, type, context, evidence, objective, constraints, affected_files, acceptance_criteria, risks, expected_tests, markdown, generated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    packet.id,
    packet.proposalId,
    packet.type,
    packet.context,
    packet.evidence,
    packet.objective,
    JSON.stringify(packet.constraints),
    JSON.stringify(packet.affectedFiles),
    packet.acceptanceCriteria,
    JSON.stringify(packet.risks),
    JSON.stringify(packet.expectedTests),
    packet.markdown,
    packet.generatedAt,
  );
}

export function getPacketDb(id: string): PromptPacket | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM prompt_packets WHERE id = ?').get(id) as PacketRow | undefined;
  return row ? rowToPacket(row) : undefined;
}

export function listPacketsDb(proposalId?: string): PromptPacket[] {
  const db = getDb();
  if (proposalId) {
    return (db.prepare('SELECT * FROM prompt_packets WHERE proposal_id = ? ORDER BY generated_at DESC').all(proposalId) as PacketRow[]).map(rowToPacket);
  }
  return (db.prepare('SELECT * FROM prompt_packets ORDER BY generated_at DESC').all() as PacketRow[]).map(rowToPacket);
}
