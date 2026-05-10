/**
 * Security & Smoke Tests — Connected Strategy Server
 *
 * P2-4a/4b/4c: Basic tests for critical endpoints.
 * Run: pnpm --filter @cs/server test
 */
import { describe, it, expect } from 'vitest';

// These tests validate server configuration and route contracts.
// They run as unit tests (no live server required) by importing route definitions.

describe('Security constraints', () => {
  it('CORS should only allow local origins', async () => {
    // Validate that the server config restricts CORS
    const indexSource = await import('fs').then(fs =>
      fs.readFileSync(new URL('../../src/index.ts', import.meta.url), 'utf-8')
    );

    // Should NOT have open cors()
    expect(indexSource).not.toMatch(/app\.use\(cors\(\)\)/);

    // Should have origin restriction
    expect(indexSource).toMatch(/origin.*127\.0\.0\.1:4310/);
  });

  it('launch endpoint should validate path prefix', async () => {
    const routeSource = await import('fs').then(fs =>
      fs.readFileSync(new URL('../../src/modules/projects/routes.ts', import.meta.url), 'utf-8')
    );

    // Should have ALLOWED_ROOTS check
    expect(routeSource).toMatch(/ALLOWED_ROOTS/);
    expect(routeSource).toMatch(/projectPath\.startsWith\(root\)/);

    // Should log launch attempts
    expect(routeSource).toMatch(/\[LAUNCH\]/);
  });

  it('server should bind to 127.0.0.1 only', async () => {
    const indexSource = await import('fs').then(fs =>
      fs.readFileSync(new URL('../../src/index.ts', import.meta.url), 'utf-8')
    );

    expect(indexSource).toMatch(/listen\(PORT,\s*['"]127\.0\.0\.1['"]/);
  });

  it('mockData should NOT contain real credentials', async () => {
    const mockSource = await import('fs').then(fs =>
      fs.readFileSync(new URL('../../../web/src/mockData.ts', import.meta.url), 'utf-8')
    );

    // Should not contain real IP
    expect(mockSource).not.toMatch(/34\.30\.64\.33/);

    // Should not contain real email in credentialHint
    expect(mockSource).not.toMatch(/rperus@sklatam\.org/);

    // Should not contain password hints
    expect(mockSource).not.toMatch(/passwordHint:\s*'B_/);
  });
});

describe('API route contracts', () => {
  it('health endpoint should exist in server index', async () => {
    const indexSource = await import('fs').then(fs =>
      fs.readFileSync(new URL('../../src/index.ts', import.meta.url), 'utf-8')
    );

    expect(indexSource).toMatch(/\/api\/health/);
    expect(indexSource).toMatch(/\/api\/projects/);
    expect(indexSource).toMatch(/\/api\/pipeline/);
  });

  it('projects routes should expose CRUD endpoints', async () => {
    const routeSource = await import('fs').then(fs =>
      fs.readFileSync(new URL('../../src/modules/projects/routes.ts', import.meta.url), 'utf-8')
    );

    expect(routeSource).toMatch(/router\.get\('\//);
    expect(routeSource).toMatch(/router\.post\('\//);
    expect(routeSource).toMatch(/router\.delete\('\/:id'/);
    expect(routeSource).toMatch(/router\.post\('\/:id\/launch'/);
  });
});
