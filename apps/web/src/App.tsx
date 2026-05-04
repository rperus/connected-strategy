/**
 * Connected Strategy — App Shell
 * SET-04 UI Workbench — full implementation
 * React Router v6 + sidebar navigation + 13 sections
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { WorksheetsPage } from './pages/WorksheetsPage';
import { CompetitivePage } from './pages/CompetitivePage';
import { BusinessModelPage } from './pages/BusinessModelPage';
import { DataSciencePage } from './pages/DataSciencePage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { AIFrontierPage } from './pages/AIFrontierPage';
import { ProposalsPage } from './pages/ProposalsPage';
import { PromptPacketsPage } from './pages/PromptPacketsPage';
import { ReportsPage } from './pages/ReportsPage';
import { LauncherPage } from './pages/LauncherPage';
import { HealthDashboardPage } from './pages/HealthDashboardPage';
import { EfficiencyFrontierPage } from './pages/EfficiencyFrontierPage';
import { StrategyMatrixPage } from './pages/StrategyMatrixPage';
import { ActivityMapPage } from './pages/ActivityMapPage';
import { FiveForcesPage } from './pages/FiveForcesPage';
import { CustomerJourneyPage } from './pages/CustomerJourneyPage';
import { STARMatrixPage } from './pages/STARMatrixPage';
import { FlywheelPage } from './pages/FlywheelPage';
import { ValueChainPage } from './pages/ValueChainPage';
import { AgentOrchestratorPage } from './pages/AgentOrchestratorPage';
import { PortfolioMatrixPage } from './pages/PortfolioMatrixPage';
import { BriefingPage } from './pages/BriefingPage';
import { PlatformIntelPage } from './pages/PlatformIntelPage';
import { StrategicImprovePage } from './pages/StrategicImprovePage';

function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <div className="workbench">
          <Sidebar />
          <main className="main-content">
            <ErrorBoundary>
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
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;
