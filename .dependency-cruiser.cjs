/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-apps-importing-apps',
      comment: 'Apps must not import from each other according to AGENTS.md rule.',
      severity: 'error',
      from: {
        path: '^apps/([^/]+)/'
      },
      to: {
        path: '^apps/([^/]+)/',
        pathNot: '^apps/$1/'
      }
    },
    {
      name: 'domain-is-leaf',
      comment: 'Domain package must not import from any other package or app.',
      severity: 'error',
      from: {
        path: '^packages/domain/'
      },
      to: {
        path: '^(apps/|packages/(?!domain/))'
      }
    },
    {
      name: 'packages-no-app-imports',
      comment: 'Packages must not import from apps.',
      severity: 'error',
      from: {
        path: '^packages/'
      },
      to: {
        path: '^apps/'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: [
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled',
        'npm-no-pkg'
      ]
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    }
  }
};
