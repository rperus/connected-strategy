import fs from 'fs';
import path from 'path';

export class FileReader {
  public filesRead: Set<string> = new Set();

  constructor(private projectPath: string) {}

  public read(relativePath: string): string {
    this.filesRead.add(relativePath);
    const fullPath = path.join(this.projectPath, relativePath);
    if (!fs.existsSync(fullPath)) return '';
    return fs.readFileSync(fullPath, 'utf-8');
  }

  public getReadFilesList(): string[] {
    return Array.from(this.filesRead);
  }
}
