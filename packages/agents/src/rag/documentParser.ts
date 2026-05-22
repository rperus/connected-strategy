import { indexDocument } from './vectorStore.js';

export async function parseAndIndexDocument(filePath: string, sourceDomain: string): Promise<void> {
  console.log(`Parsing document ${filePath} for domain ${sourceDomain}`);
  const mockBuffer = Buffer.from('mock content');
  await indexDocument(mockBuffer, { sourceDomain, parsedAt: new Date().toISOString() });
}
