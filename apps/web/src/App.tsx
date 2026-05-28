/**
 * Connected Strategy — App Shell
 * SET-04 UI Workbench — full implementation
 * React Router v6 + sidebar navigation + lazy-loaded pages for bundle optimization
 */
import React, { Suspense } from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StrategyCopilot } from './components/StrategyCopilot';

const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));

// ─── Lazy-loaded pages for code-splitting ────────────────────────────────────
const PortfolioPage = React.lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const WorksheetsPage = React.lazy(() => import('./pages/WorksheetsPage').then(m => ({ default: m.WorksheetsPage })));
const CompetitivePage = React.lazy(() => import('./pages/CompetitivePage').then(m => ({ default: m.CompetitivePage })));
const BusinessModelPage = React.lazy(() => import('./pages/BusinessModelPage').then(m => ({ default: m.BusinessModelPage })));
const DataSciencePage = React.lazy(() => import('./pages/DataSciencePage').then(m => ({ default: m.DataSciencePage })));
const ArchitecturePage = React.lazy(() => import('./pages/ArchitecturePage').then(m => ({ default: m.ArchitecturePage })));
const AIFrontierPage = React.lazy(() => import('./pages/AIFrontierPage').then(m => ({ default: m.AIFrontierPage })));
const ProposalsPage = React.lazy(() => import('./pages/ProposalsPage').then(m => ({ default: m.ProposalsPage })));
const PromptPacketsPage = React.lazy(() => import('./pages/PromptPacketsPage').then(m => ({ default: m.PromptPacketsPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const LauncherPage = React.lazy(() => import('./pages/LauncherPage').then(m => ({ default: m.LauncherPage })));
const V3Dashboard = React.lazy(() => import('./pages/v3/V3Dashboard').then(m => ({ default: m.V3Dashboard })));
const V3Moves = React.lazy(() => import('./pages/v3/V3Moves').then(m => ({ default: m.V3Moves })));
const HealthDashboardPage = React.lazy(() => import('./pages/HealthDashboardPage').then(m => ({ default: m.HealthDashboardPage })));
const EfficiencyFrontierPage = React.lazy(() => import('./pages/EfficiencyFrontierPage').then(m => ({ default: m.EfficiencyFrontierPage })));
const StrategyMatrixPage = React.lazy(() => import('./pages/StrategyMatrixPage').then(m => ({ default: m.StrategyMatrixPage })));
const ActivityMapPage = React.lazy(() => import('./pages/ActivityMapPage').then(m => ({ default: m.ActivityMapPage })));
const FiveForcesPage = React.lazy(() => import('./pages/FiveForcesPage').then(m => ({ default: m.FiveForcesPage })));
const CustomerJourneyPage = React.lazy(() => import('./pages/CustomerJourneyPage').then(m => ({ default: m.CustomerJourneyPage })));
const STARMatrixPage = React.lazy(() => import('./pages/STARMatrixPage').then(m => ({ default: m.STARMatrixPage })));
const FlywheelPage = React.lazy(() => import('./pages/FlywheelPage').then(m => ({ default: m.FlywheelPage })));
const ValueChainPage = React.lazy(() => import('./pages/ValueChainPage').then(m => ({ default: m.ValueChainPage })));
const AgentOrchestratorPage = React.lazy(() => import('./pages/AgentOrchestratorPage').then(m => ({ default: m.AgentOrchestratorPage })));
const PortfolioMatrixPage = React.lazy(() => import('./pages/PortfolioMatrixPage').then(m => ({ default: m.PortfolioMatrixPage })));
const BriefingPage = React.lazy(() => import('./pages/BriefingPage').then(m => ({ default: m.BriefingPage })));
const PlatformIntelPage = React.lazy(() => import('./pages/PlatformIntelPage').then(m => ({ default: m.PlatformIntelPage })));
const StrategicImprovePage = React.lazy(() => import('./pages/StrategicImprovePage').then(m => ({ default: m.StrategicImprovePage })));
const CausalDagPage = React.lazy(() => import('./pages/CausalDagPage').then(m => ({ default: m.CausalDagPage })));
const SwarmComparatorPage = React.lazy(() => import('./pages/SwarmComparatorPage').then(m => ({ default: m.SwarmComparatorPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const QuickStartPage = React.lazy(() => import('./pages/QuickStartPage').then(m => ({ default: m.QuickStartPage })));

// ─── Loading fallback (W3-3: skeleton loader) ────────────────────────────────
function PageLoader() {
  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .skel {
          background: linear-gradient(90deg, var(--cs-surface-2), var(--cs-surface-3, rgba(36,39,62,0.7)), var(--cs-surface-2));
          background-size: 200% 100%;
          border-radius: 8px;
          animation: skeletonPulse 1.6s ease-in-out infinite;
        }
      `}</style>
      {/* Page title skeleton */}
      <div className="skel" style={{ height: 32, width: '40%', marginBottom: 10 }} />
      <div className="skel" style={{ height: 14, width: '60%', marginBottom: 32 }} />
      {/* Cards grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'var(--cs-surface-glass)',
            border: '1px solid var(--cs-border)',
            borderRadius: 16,
            padding: 24,
            animationDelay: `${i * 0.1}s`,
          }}>
            <div className="skel" style={{ height: 20, width: '70%', marginBottom: 12 }} />
            <div className="skel" style={{ height: 12, width: '90%', marginBottom: 8 }} />
            <div className="skel" style={{ height: 12, width: '60%', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skel" style={{ height: 24, width: 60 }} />
              <div className="skel" style={{ height: 24, width: 80 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function App() {
  if (!clerkPubKey) {
    // Local dev fallback
    return <InnerApp />;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <InnerApp />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}

function InnerApp() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <div className="app-layout">
          {/* W1-7: Skip navigation link — WCAG 2.4.1 (keyboard users bypass 29-item sidebar) */}
          <a
            href="#main-content"
            className="skip-nav"
            style={{
              position: 'absolute',
              top: -40,
              left: 0,
              padding: '8px 16px',
              background: 'var(--cs-primary)',
              color: 'white',
              zIndex: 99999,
              borderRadius: '0 0 8px 0',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'top 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.top = '0'; }}
            onBlur={(e) => { e.currentTarget.style.top = '-40px'; }}
          >
            Saltar al contenido principal
          </a>
          <Sidebar />
          <StrategyCopilot />
          <main id="main-content" className="main-content">
            <Routes>
                  {/* Root routes */}
                  <Route path="/" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HomePage /></Suspense></ErrorBoundary>} />
                  <Route path="/health" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><HealthDashboardPage /></Suspense></ErrorBoundary>} />
                  <Route path="/quick-start" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><QuickStartPage /></Suspense></ErrorBoundary>} />
                  <Route path="/portfolio" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense></ErrorBoundary>} />
                  <Route path="/project/:id" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProjectDetailPage /></Suspense></ErrorBoundary>} />
                  <Route path="/worksheets" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><WorksheetsPage /></Suspense></ErrorBoundary>} />
                  <Route path="/competitive" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><CompetitivePage /></Suspense></ErrorBoundary>} />
                  <Route path="/business-model" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><BusinessModelPage /></Suspense></ErrorBoundary>} />
                  <Route path="/data-science" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><DataSciencePage /></Suspense></ErrorBoundary>} />
                  <Route path="/architecture" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ArchitecturePage /></Suspense></ErrorBoundary>} />
                  <Route path="/ai-frontier" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AIFrontierPage /></Suspense></ErrorBoundary>} />
                  <Route path="/proposals" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ProposalsPage /></Suspense></ErrorBoundary>} />
                  <Route path="/prompts" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PromptPacketsPage /></Suspense></ErrorBoundary>} />
                  <Route path="/reports" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ReportsPage /></Suspense></ErrorBoundary>} />
                  <Route path="/launcher" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><LauncherPage /></Suspense></ErrorBoundary>} />
                  <Route path="/frontier" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><EfficiencyFrontierPage /></Suspense></ErrorBoundary>} />
                  <Route path="/strategy-matrix" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><StrategyMatrixPage /></Suspense></ErrorBoundary>} />
                  <Route path="/activity-map" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityMapPage /></Suspense></ErrorBoundary>} />
                  <Route path="/five-forces" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><FiveForcesPage /></Suspense></ErrorBoundary>} />
                  <Route path="/customer-journey" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><CustomerJourneyPage /></Suspense></ErrorBoundary>} />
                  <Route path="/star-matrix" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><STARMatrixPage /></Suspense></ErrorBoundary>} />
                  <Route path="/flywheel" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><FlywheelPage /></Suspense></ErrorBoundary>} />
                  <Route path="/value-chain" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><ValueChainPage /></Suspense></ErrorBoundary>} />
                  <Route path="/agents" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><AgentOrchestratorPage /></Suspense></ErrorBoundary>} />
                  <Route path="/matrix" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PortfolioMatrixPage /></Suspense></ErrorBoundary>} />
                  <Route path="/briefing" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><BriefingPage /></Suspense></ErrorBoundary>} />
                  <Route path="/intel" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><PlatformIntelPage /></Suspense></ErrorBoundary>} />
                  <Route path="/improve" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><StrategicImprovePage /></Suspense></ErrorBoundary>} />
                  <Route path="/causal" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><CausalDagPage /></Suspense></ErrorBoundary>} />
                  <Route path="/swarm-comparator" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><SwarmComparatorPage /></Suspense></ErrorBoundary>} />
                  <Route path="/v3" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><V3Dashboard /></Suspense></ErrorBoundary>} />
                  <Route path="/v3/moves" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><V3Moves /></Suspense></ErrorBoundary>} />
                  <Route path="/settings" element={<ErrorBoundary><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ErrorBoundary>} />
                </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;
