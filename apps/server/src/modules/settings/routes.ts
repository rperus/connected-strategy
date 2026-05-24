import { Router, Request, Response } from 'express';
import { getDb } from '../../db/index.js';

const router: Router = Router();

// GET /api/settings
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('GEMINI_API_KEY') as { value: string } | undefined;
    
    let hasKey = false;
    let maskedKey = '';
    
    if (row && row.value) {
      hasKey = true;
      maskedKey = row.value.substring(0, 4) + '...' + row.value.substring(row.value.length - 4);
    } else if (process.env.GEMINI_API_KEY) {
      hasKey = true;
      const envKey = process.env.GEMINI_API_KEY;
      maskedKey = envKey.substring(0, 4) + '...' + envKey.substring(envKey.length - 4);
    }
    
    res.json({ ok: true, settings: { hasKey, maskedKey } });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/settings
router.post('/', (req: Request, res: Response) => {
  try {
    const { geminiApiKey } = req.body;
    const db = getDb();

    // W0-7 SECURITY: In production, GEMINI_API_KEY must come from GCP Secret Manager.
    // Storing secrets in SQLite is only acceptable for local-first development.
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        ok: false,
        error: 'API key storage via UI is disabled in production. Use GCP Secret Manager.',
      });
    }
    
    if (geminiApiKey !== undefined) {
      // Si mandan un string vacío, lo borramos (modo offline determinista)
      if (geminiApiKey.trim() === '') {
        db.prepare('DELETE FROM settings WHERE key = ?').run('GEMINI_API_KEY');
        delete process.env.GEMINI_API_KEY;
      } else {
        // W0-7: Log a warning — key is stored in plaintext for local dev only
        console.warn('[SETTINGS] API key stored in local SQLite (local-dev only). In production, use Secret Manager.');
        db.prepare(`
          INSERT INTO settings (key, value, updated_at) 
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run('GEMINI_API_KEY', geminiApiKey.trim());
        process.env.GEMINI_API_KEY = geminiApiKey.trim();
      }
    }
    
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/settings/validate-key
router.post('/validate-key', async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ ok: false, valid: false, error: 'Key is required' });
    }
    
    // Validar llamando a un endpoint barato de la API de Gemini (listar modelos)
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const fetchRes = await fetch(url);
    const data = await fetchRes.json() as any;
    
    if (fetchRes.ok && data.models) {
      return res.json({ ok: true, valid: true });
    } else {
      return res.json({ ok: true, valid: false, error: data.error?.message || 'Invalid key' });
    }
  } catch (err: any) {
    res.status(500).json({ ok: false, valid: false, error: err.message });
  }
});

export default router;
