import os
import re

files = [
  'tests/core.test.ts',
  'packages/domain/src/v3/__tests__/schemas.test.ts',
  'packages/domain/src/scoring.test.ts',
  'packages/knowledge/src/chunker.test.ts',
  'packages/agents/src/v3/__tests__/handoff.test.ts',
  'packages/agents/src/v3/__tests__/state-store.test.ts',
  'packages/agents/src/v3/__tests__/chief-strategist.test.ts',
  'packages/agents/src/v3/__tests__/agents.test.ts',
  'packages/agents/src/v3/frontier/__tests__/engine.test.ts',
  'apps/server/src/__tests__/security.test.ts'
]

for f in files:
  path = os.path.join('c:/dev/Connected_Strategy', f)
  if not os.path.exists(path): continue
  with open(path, 'r', encoding='utf-8') as file: content = file.read()
  
  def repl(m):
      imports = m.group(1).replace('expect,', '').replace(', expect', '').replace('expect', '').strip()
      return f"import {{ {imports} }} from 'node:test';\nimport {{ expect }} from 'expect';"

  content = re.sub(r"import\s*\{([^}]+)\}\s*from\s*'vitest';", repl, content)
  with open(path, 'w', encoding='utf-8') as file: file.write(content)
