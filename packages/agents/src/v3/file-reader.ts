import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class FileReader {
  public filesRead: Set<string> = new Set();

  constructor(private projectPath: string) {}

  public read(relativePath: string, offset: number = 0, limit: number = 200): string {
    this.filesRead.add(relativePath);
    const fullPath = path.join(this.projectPath, relativePath);
    if (!fs.existsSync(fullPath)) return '';
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    return lines.slice(offset, offset + limit).join('\n');
  }

  public grep(pattern: string, globPattern?: string, maxResults: number = 30): string {
    try {
      const globArg = globPattern ? `-- "${globPattern}"` : '';
      const output = execSync(`git grep -n -e "${pattern.replace(/"/g, '\\"')}" ${globArg}`, { cwd: this.projectPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      return output.split('\n').slice(0, maxResults).join('\n');
    } catch {
      return 'No matches found.';
    }
  }

  public getReadFilesList(): string[] {
    return Array.from(this.filesRead);
  }
}
