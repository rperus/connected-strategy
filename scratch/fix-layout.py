import os, glob, re

target_files = glob.glob('apps/web/src/**/*.tsx', recursive=True)

pattern = re.compile(r'width:\s*`\$\{([^}]+)\}%`')

def repl(m):
    val = m.group(1)
    if not '/' in val and not '*' in val and not '+' in val and not '-' in val:
        return f'transform: `scaleX(${{{val} / 100}})`'
    else:
        return f'transform: `scaleX(${val} / 100)`'

count = 0
for f in target_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    new_content, num_subs = pattern.subn(repl, content)
    
    if num_subs > 0:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += num_subs
        print(f'Replaced {num_subs} matches in {f}')
print(f'Total replacements: {count}')
