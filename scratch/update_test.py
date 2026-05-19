import json
import glob

def update(path, new_test):
  with open(path, 'r', encoding='utf-8') as f: data = json.load(f)
  if 'scripts' in data and 'test' in data['scripts']:
    data['scripts']['test'] = new_test
    with open(path, 'w', encoding='utf-8') as f: json.dump(data, f, indent=2)
    print(f"Updated {path}")

update('package.json', 'pnpm -r test')
update('apps/server/package.json', 'tsc --noEmit && node --test "dist/**/*.test.js"')
update('packages/agents/package.json', 'tsc --noEmit && node --test "dist/**/*.test.js"')
