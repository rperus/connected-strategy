const fs = require('fs');
const path = require('path');
const dir = 'c:/dev/Connected_Strategy/packages/agents/src/v3/agents/swarm';
const files = fs.readdirSync(dir).filter(f => f !== 'index.ts' && f !== 'schema.ts' && f.endsWith('.ts'));

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  
  if (!content.includes('ctx.sharedFindings')) {
    content = content.replace(
      /(const result = await callLLMValidated[^\n]+;\n)/,
      "$1\n    if (ctx.sharedFindings && result.findings) {\n      result.findings.forEach(f => ctx.sharedFindings.publish(f));\n    }\n"
    );
    fs.writeFileSync(fp, content);
    console.log('Updated ' + file);
  }
}
