/**
 * Connected Strategy — App Shell
 * SET-04 UI Workbench — full implementation
 * React Router v6 + sidebar navigation + 13 sections
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {

  return (
    <BrowserRouter>
      <div className="workbench">
        <Sidebar projectName="Connected Strategy" />
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
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
