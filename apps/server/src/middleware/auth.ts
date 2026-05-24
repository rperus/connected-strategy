import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import type { Request, Response, NextFunction } from 'express';

/**
 * Clerk Authentication Middleware
 * 
 * Protects all /api routes. If CLERK_SECRET_KEY is not defined (e.g. in local development),
 * it bypasses authentication to maintain the frictionless local-first DX.
 * In production (Cloud Run), CLERK_SECRET_KEY must be injected via Secret Manager.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Bypass if no Clerk keys are provided (Local development mode)
  if (!process.env.CLERK_SECRET_KEY && !process.env.CLERK_PUBLISHABLE_KEY) {
    // W0-3 SECURITY: In production, refuse to start without Clerk keys.
    // Without this guard, a misconfigured deploy would expose all /api/* endpoints.
    if (process.env.NODE_ENV === 'production') {
      console.error('[AUTH] FATAL: CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY are required in production.');
      console.error('[AUTH] Refusing to accept requests without authentication. Exiting.');
      process.exit(1);
    }

    if (req.path === '/health') return next(); // don't spam logs for healthchecks
    
    // Inject a dummy local tenant
    (req as any).auth = { userId: 'local-admin', tenantId: 'local-workspace' };
    return next();
  }

  // Use Clerk's strict require auth which returns 401 if unauthenticated
  ClerkExpressRequireAuth()(req, res, (err: any) => {
    if (err) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Missing or invalid Clerk token' });
    }
    next();
  });
}
