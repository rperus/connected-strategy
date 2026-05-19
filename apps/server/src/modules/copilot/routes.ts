import { Router, Request, Response } from 'express';
import { ProjectStateStore, getGeminiProvider } from '@cs/agents';
import { listProjects } from '../../db/repositories/projects.js';

const router: Router = Router();
const store = new ProjectStateStore();

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, projectId, history } = req.body;
    if (!message) return res.status(400).json({ ok: false, error: 'Message required' });

    const llm = getGeminiProvider();
    if (!llm.available) {
      return res.status(503).json({ ok: false, error: 'Gemini LLM is not configured/available.' });
    }

    let systemContext = `You are Cerebro, the intelligent Strategy Copilot for the Connected Strategy platform.
You analyze project state and answer user questions in Markdown.
`;

    if (projectId) {
      const state = store.load(projectId);
      if (state) {
        systemContext += `\n\nCURRENT PROJECT (${state.projectName}):\n${JSON.stringify(state.synthesis?.topPriorities || [], null, 2)}`;
        if (state.swarm?.findings?.length) {
          systemContext += `\n\nLATEST FINDINGS:\n${JSON.stringify(state.swarm.findings.slice(-5), null, 2)}`;
        }
      }
    } else {
      const projects = listProjects();
      const overview = projects.map(p => {
        const state = store.load(p.id);
        const prioCount = state?.synthesis?.topPriorities?.length || 0;
        return `- ${p.name}: ${prioCount} priorities`;
      });
      systemContext += `\n\nPORTFOLIO OVERVIEW:\n${overview.join('\n')}`;
    }

    const prompt = `${systemContext}\n\nUSER MESSAGE:\n${message}`;

    const response = await llm.generate(prompt);
    
    res.json({ ok: true, text: response.text });
  } catch (err: any) {
    console.error('[Copilot] Error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
