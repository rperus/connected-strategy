import fs from 'fs';
import path from 'path';
// @ts-ignore
import { PDFParse } from 'pdf-parse';

export interface PdfCleanResult {
  rawText: string;
  cleanedText: string;
  totalPages: number;
  metadata: any;
  noiseRemovedLinesCount: number;
}

/**
 * Clean raw text extracted from a PDF to remove metadata noise, headers, page numbers,
 * and broken spacing artifacts.
 */
export function cleanPdfText(rawText: string): { cleanedText: string; noiseRemovedCount: number } {
  const lines = rawText.split('\n');
  const cleanedLines: string[] = [];
  let noiseRemovedCount = 0;

  // Patterns for typical PDF header/footer noise
  const pageNumRegex = /^(page\s+\d+|p\.\s*\d+|\d+\s*of\s*\d+|\b\d+\b)$/i;
  
  // Specific course headers that repeat across pages
  const repeatedHeaders = [
    /wharton\s+school/i,
    /university\s+of\s+pennsylvania/i,
    /competitive\s+advantage/i,
    /connected\s+strategy/i,
    /christian\s+terwiesch/i,
    /nicolaj\s+siggelkow/i,
  ];

  for (let line of lines) {
    const trimmed = line.trim();

    // 1. Skip empty lines (we will add spacing back later structurally)
    if (trimmed === '') {
      continue;
    }

    // 2. Skip single numbers or common page number formats
    if (pageNumRegex.test(trimmed)) {
      noiseRemovedCount++;
      continue;
    }

    // 3. Skip known repeated headers or footers
    let isHeaderNoise = false;
    for (const pattern of repeatedHeaders) {
      if (pattern.test(trimmed) && trimmed.length < 60) {
        isHeaderNoise = true;
        break;
      }
    }
    if (isHeaderNoise) {
      noiseRemovedCount++;
      continue;
    }

    // 4. Skip lines that are purely symbols or look like layout noise (e.g. "----------" or "_____")
    if (/^[_\-\s\.\*~+=|#\/]+$/.test(trimmed)) {
      noiseRemovedCount++;
      continue;
    }

    // 5. Skip email addresses or URLs alone in a line if they feel like footer contact details
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed) || /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/.test(trimmed)) {
      // Let's keep URLs if they are long, but discard short ones that repeat in footers
      if (trimmed.length < 40) {
        noiseRemovedCount++;
        continue;
      }
    }

    // Clean spacing: replace multiple spaces with single space
    const cleanedLine = trimmed.replace(/\s+/g, ' ');
    cleanedLines.push(cleanedLine);
  }

  // Combine lines with structured paragraphs. 
  // Often, PDFs break sentences across lines. We can reconstruct paragraphs by looking
  // at whether the line ends with a period, question mark, or colon.
  const structuredParagraphs: string[] = [];
  let currentParagraph = '';

  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    
    if (currentParagraph === '') {
      currentParagraph = line;
    } else {
      // If previous part ends with sentence ending, start new paragraph or join with space
      const endsWithSentenceTerminator = /[\.\?\!]$/.test(currentParagraph);
      
      // If it ends with sentence terminator and the next line starts with a capital letter,
      // let's treat it as a potential paragraph break or just append with space.
      if (endsWithSentenceTerminator && /^[A-Z]/.test(line)) {
        structuredParagraphs.push(currentParagraph);
        currentParagraph = line;
      } else {
        // Join broken sentence line
        currentParagraph += ' ' + line;
      }
    }
  }

  if (currentParagraph !== '') {
    structuredParagraphs.push(currentParagraph);
  }

  return {
    cleanedText: structuredParagraphs.join('\n\n'),
    noiseRemovedCount,
  };
}

/**
 * Extracts and cleans text from a PDF file.
 */
export async function parsePdfFile(filePath: string): Promise<PdfCleanResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  
  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    
    const rawText = textResult.text || '';
    const { cleanedText, noiseRemovedCount } = cleanPdfText(rawText);

    return {
      rawText,
      cleanedText,
      totalPages: infoResult.total || 0,
      metadata: infoResult.info || {},
      noiseRemovedLinesCount: noiseRemovedCount,
    };
  } finally {
    await parser.destroy();
  }
}

/**
 * Convenience function to parse a PDF and write its cleaned text version to disk.
 */
export async function convertPdfToCleanTextFile(
  pdfPath: string,
  outputPath?: string,
): Promise<string> {
  const result = await parsePdfFile(pdfPath);
  const targetPath = outputPath || pdfPath.replace(/\.pdf$/i, '_cleaned.txt');
  
  fs.writeFileSync(targetPath, result.cleanedText, 'utf-8');
  console.log(`[PDF] Cleaned text saved to: ${targetPath} (${result.totalPages} pages, removed ${result.noiseRemovedLinesCount} noise lines)`);
  return targetPath;
}
