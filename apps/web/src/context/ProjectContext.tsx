/**
 * ProjectContext — Global project selector state
 * Persists selected project to localStorage so it survives refreshes.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_PROJECTS } from '../mockData';
import type { Project } from '@cs/domain';

const LS_KEY = 'cs_active_project_id';

interface ProjectContextValue {
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  allProjects: Project[];
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project>(() => {
    const savedId = localStorage.getItem(LS_KEY);
    return MOCK_PROJECTS.find(p => p.id === savedId) ?? MOCK_PROJECTS[0];
  });

  const setActiveProject = useCallback((project: Project) => {
    localStorage.setItem(LS_KEY, project.id);
    setActiveProjectState(project);
  }, []);

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, allProjects: MOCK_PROJECTS }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
}
