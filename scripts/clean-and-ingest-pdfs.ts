import fs from 'fs';
import path from 'path';
import { parsePdfFile } from '../packages/agents/src/rag/pdfParser.js';
import { ingestCustomFile, getIngestionStatus } from '../packages/agents/src/index.js';

// Setup paths
const KNOWLEDGE_DIR = 'C:\\dev\\Connected_Strategy\\data\\knowledge';

async function main() {
  console.log(`[PDF Ingester] 🚀 Scanning for PDF files in: ${KNOWLEDGE_DIR}`);
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Error: Directory does not exist: ${KNOWLEDGE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.log('[PDF Ingester] No PDF files found in data/knowledge.');
    return;
  }

  console.log(`[PDF Ingester] Found ${pdfFiles.length} PDF file(s). Starting extraction and cleaning...\n`);

  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(KNOWLEDGE_DIR, pdfFile);
    // Determine target cleaned txt file name
    let cleanTxtName = pdfFile.replace(/\.pdf$/i, '_cleaned.txt');
    
    // Smart Mapping: If worksheets.pdf is found, we can also map/copy it as WorkSheet_Todas.txt to fit the default Wharton catalog!
    if (pdfFile.toLowerCase() === 'worksheets.pdf') {
      cleanTxtName = 'WorkSheet_Todas.txt';
    }

    const txtOutputPath = path.join(KNOWLEDGE_DIR, cleanTxtName);

    console.log(`[PDF Ingester] Processing: "${pdfFile}"...`);
    try {
      const result = await parsePdfFile(pdfPath);
      
      fs.writeFileSync(txtOutputPath, result.cleanedText, 'utf-8');
      
      console.log(`  └─ Success: Saved to "${cleanTxtName}"`);
      console.log(`  └─ Pages: ${result.totalPages}`);
      console.log(`  └─ Noise/Garbage lines removed: ${result.noiseRemovedLinesCount}`);
      
      // Auto-ingest into the RAG SQLite database as a custom file!
      console.log(`  └─ Indexing into RAG database...`);
      const ingestReport = await ingestCustomFile(txtOutputPath, `Cleaned PDF: ${pdfFile}`, ['ws01_problem_actors']);
      console.log(`  └─ Ingestion status: ${ingestReport.success ? '✅ Indexed' : '❌ Failed: ' + ingestReport.errorMessage}`);
      console.log(`  └─ Chunks created: ${ingestReport.chunksProduced}\n`);

    } catch (err: any) {
      console.error(`  └─ ❌ Error processing "${pdfFile}": ${err.message || err}\n`);
    }
  }

  console.log('[PDF Ingester] 🎉 All PDFs processed.');
  
  // Show stats
  const status = getIngestionStatus();
  console.log(`\n[RAG Status] Total chunks in DB: ${status.totalChunks}`);
  console.log(`[RAG Status] Total sources indexed: ${status.sourceCount}`);
}

main().catch(err => {
  console.error('[Fatal Error]', err);
});
