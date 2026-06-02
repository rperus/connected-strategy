import { Project, SyntaxKind, FunctionDeclaration } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: 'C:/dev/Connected_Strategy/packages/agents/tsconfig.json',
});

const agentsDir = 'C:/dev/Connected_Strategy/packages/agents/src/v3/agents';
const files = project.getSourceFiles(`${agentsDir}/**/*.ts`)
  .filter(f => !f.getFilePath().includes('competitor-intelligence.ts') && !f.getFilePath().includes('index.ts') && !f.getFilePath().includes('schema.ts'));

for (const sourceFile of files) {
  console.log(`Processing ${sourceFile.getBaseName()}...`);

  // 1. Add EventHub import if not present
  const hasEventHub = sourceFile.getImportDeclarations().some(i => i.getModuleSpecifierValue().includes('event-hub.js'));
  if (!hasEventHub) {
    let relativePath = '../hub/event-hub.js';
    if (sourceFile.getFilePath().includes('/swarm/')) relativePath = '../../hub/event-hub.js';
    
    sourceFile.addImportDeclaration({
      namedImports: ['EventHub'],
      moduleSpecifier: relativePath,
    });
  }

  // 2. Find the main runX function
  const runFuncs = sourceFile.getFunctions().filter(f => f.isExported() && f.getName()?.startsWith('run'));
  if (runFuncs.length === 0) continue;
  
  const runFunc = runFuncs[0];
  const oldName = runFunc.getName()!;
  const newName = oldName.replace('run', 'register');
  const eventName = oldName.replace('run', 'RUN_').replace(/([A-Z])/g, '_$1').toUpperCase();
  const completedEventName = eventName.replace('RUN_', '') + '_COMPLETED';
  
  const params = runFunc.getParameters();
  const hasInput = params.length > 1; // Assuming input, ctx
  const inputType = hasInput ? params[0].getTypeNode()?.getText() : null;

  // Change function signature
  runFunc.rename(newName);
  runFunc.setIsAsync(false);
  
  runFunc.getParameters().forEach(p => p.remove());
  runFunc.addParameter({ name: 'hub', type: 'EventHub' });
  runFunc.addParameter({ name: 'ctx', type: 'any' }); // fallback to any if type is complex, or let's use the explicit name
  runFunc.setReturnType('void');

  const oldBodyText = runFunc.getBodyText()!;
  
  // Replace direct returns with hub publishing
  let newBody = oldBodyText.replace(/return\s+{\s*success:\s*true,\s*data:\s*(.*?),\s*tokensUsed.*?};/s, 
    `// Update state here if needed
    // hub.updateState(event.projectId, (state) => { /* update logic */ });
    
    await hub.publish({
      domain: 'lifecycle',
      type: '${completedEventName}',
      projectId: event.projectId,
      payload: { success: true, data: $1 },
      timestamp: Date.now()
    });`);
    
  newBody = newBody.replace(/return\s+{\s*success:\s*false,\s*error:\s*(.*?),\s*tokensUsed.*?};/s, 
    `await hub.publish({
      domain: 'lifecycle',
      type: '${completedEventName}_FAILED',
      projectId: event.projectId,
      payload: { success: false, error: $1 },
      timestamp: Date.now()
    });`);

  if (hasInput) {
    runFunc.setBodyText(`hub.subscribe${inputType ? '<'+inputType+'>' : ''}('${eventName}', async (event) => {
      const input = event.payload;
      ${newBody}
    });`);
  } else {
    runFunc.setBodyText(`hub.subscribe('${eventName}', async (event) => {
      ${newBody}
    });`);
  }
}

project.saveSync();
console.log('Finished refactoring agents.');
