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

// ─── Eager: HomePage loads immediately (landing page) ────────────────────────
import { HomePage } from './pages/HomePage';

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

// ─── Loading fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', opacity: 0.5 }}>
      <span style={{ fontSize: 18 }}>Cargando…</span>
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
          <Sidebar />
          <StrategyCopilot />
          <main className="main-content">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/health" element={<HealthDashboardPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/project/:id" element={<ProjectDetailPage />} />
                  <Route path="/worksheets" element={<WorksheetsPage />} />
                  <Route path="/competitive" element={<CompetitivePage />} />
                  <Route path="/business-model" element={<BusinessModelPage />} />
                  <Route path="/data-science" element={<DataSciencePage />} />
                  <Route path="/architecture" element={<ArchitecturePage />} />
                  <Route path="/ai-frontier" element={<AIFrontierPage />} />
                  <Route path="/proposals" element={<ProposalsPage />} />
                  <Route path="/prompts" element={<PromptPacketsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/launcher" element={<LauncherPage />} />
                  <Route path="/frontier" element={<EfficiencyFrontierPage />} />
                  <Route path="/strategy-matrix" element={<StrategyMatrixPage />} />
                  <Route path="/activity-map" element={<ActivityMapPage />} />
                  <Route path="/five-forces" element={<FiveForcesPage />} />
                  <Route path="/customer-journey" element={<CustomerJourneyPage />} />
                  <Route path="/star-matrix" element={<STARMatrixPage />} />
                  <Route path="/flywheel" element={<FlywheelPage />} />
                  <Route path="/value-chain" element={<ValueChainPage />} />
                  <Route path="/agents" element={<AgentOrchestratorPage />} />
                  <Route path="/matrix" element={<PortfolioMatrixPage />} />
                  <Route path="/briefing" element={<BriefingPage />} />
                  <Route path="/intel" element={<PlatformIntelPage />} />
                  <Route path="/improve" element={<StrategicImprovePage />} />
                  <Route path="/causal" element={<CausalDagPage />} />
                  <Route path="/swarm-comparator" element={<SwarmComparatorPage />} />
                  <Route path="/v3" element={<V3Dashboard />} />
                  <Route path="/v3/moves" element={<V3Moves />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;
