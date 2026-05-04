import path from 'path';
import fs from 'fs';
import { Project } from 'ts-morph';

export interface DiscoveredFile {
  path: string;
  relativePath: string;
  language: 'ts' | 'js' | 'py' | 'go' | 'rs' | 'java' | 'sql' | 'md' | 'yml' | 'json' | 'other';
  category: 'route' | 'model' | 'service' | 'controller' | 'middleware' |
            'config' | 'test' | 'migration' | 'component' | 'util' | 'unknown';
  loc: number;
}

export async function discoverProjectFiles(projectPath: string): Promise<{
  byCategory: Record<DiscoveredFile['category'], DiscoveredFile[]>;
  byLanguage: Record<DiscoveredFile['language'], DiscoveredFile[]>;
  total: number;
  hasMonorepo: boolean;
  packageJson: any;
  readme: string;
}> {
  const result = {
    byCategory: {} as Record<DiscoveredFile['category'], DiscoveredFile[]>,
    byLanguage: {} as Record<DiscoveredFile['language'], DiscoveredFile[]>,
    total: 0,
    hasMonorepo: false,
    packageJson: null,
    readme: ''
  };

  const categories: DiscoveredFile['category'][] = ['route', 'model', 'service', 'controller', 'middleware', 'config', 'test', 'migration', 'component', 'util', 'unknown'];
  const languages: DiscoveredFile['language'][] = ['ts', 'js', 'py', 'go', 'rs', 'java', 'sql', 'md', 'yml', 'json', 'other'];

  for (const cat of categories) result.byCategory[cat] = [];
  for (const lang of languages) result.byLanguage[lang] = [];

  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try { result.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')); } catch {}
  }
  if ((result.packageJson as any)?.workspaces || fs.existsSync(path.join(projectPath, 'pnpm-workspace.yaml'))) {
    result.hasMonorepo = true;
  }

  const readmePath = path.join(projectPath, 'README.md');
  if (fs.existsSync(readmePath)) result.readme = fs.readFileSync(readmePath, 'utf-8');

  // Simple recursive find
  const walk = (dir: string) => {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        processFile(fullPath);
      }
    }
  };

  const processFile = (fullPath: string) => {
    const ext = path.extname(fullPath).toLowerCase();
    let lang: DiscoveredFile['language'] = 'other';
    if (['.ts', '.tsx'].includes(ext)) lang = 'ts';
    else if (['.js', '.jsx'].includes(ext)) lang = 'js';
    else if (ext === '.py') lang = 'py';
    else if (ext === '.go') lang = 'go';
    else if (ext === '.rs') lang = 'rs';
    else if (ext === '.java') lang = 'java';
    else if (ext === '.sql') lang = 'sql';
    else if (ext === '.md') lang = 'md';
    else if (['.yml', '.yaml'].includes(ext)) lang = 'yml';
    else if (ext === '.json') lang = 'json';

    let cat: DiscoveredFile['category'] = 'unknown';
    const lowPath = fullPath.toLowerCase();
    if (lowPath.includes('route') || lowPath.includes('controller')) cat = 'route';
    else if (lowPath.includes('model') || lowPath.includes('schema') || lowPath.includes('entity')) cat = 'model';
    else if (lowPath.includes('service') || lowPath.includes('usecase')) cat = 'service';
    else if (lowPath.includes('middleware')) cat = 'middleware';
    else if (lowPath.includes('config') || lowPath.includes('.env')) cat = 'config';
    else if (lowPath.includes('test') || lowPath.includes('spec')) cat = 'test';
    else if (lowPath.includes('migration')) cat = 'migration';
    else if (lowPath.includes('component') || ext === '.tsx' || ext === '.jsx' || ext === '.vue' || ext === '.svelte') cat = 'component';
    else if (lowPath.includes('util') || lowPath.includes('helper')) cat = 'util';

    // TS-morph could be used here to refine component vs route by inspecting exports, 
    // but heuristic by path is much faster and usually sufficient for discovery phase.
    const content = fs.readFileSync(fullPath, 'utf-8');
    const loc = content.split('\n').length;

    const df: DiscoveredFile = {
      path: fullPath,
      relativePath: path.relative(projectPath, fullPath),
      language: lang,
      category: cat,
      loc
    };

    result.byCategory[cat].push(df);
    result.byLanguage[lang].push(df);
    result.total++;
  };

  if (fs.existsSync(projectPath)) {
    walk(projectPath);
  }

  return result;
}
