/**
 * ProjectContext — Global project selector state
 * Persists selected project to localStorage so it survives refreshes.
 * Attempts to load from API; falls back to MOCK_PROJECTS.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_PROJECTS } from '../mockData';
import { api } from '../config';
import type { Project } from '@cs/domain';

const LS_KEY = 'cs_active_project_id';

type DataSource = 'mock' | 'live' | 'cached';

interface ProjectContextValue {
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  allProjects: Project[];
  /** Indicates whether project data comes from API, cache, or mock */
  dataSource: DataSource;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [dataSource, setDataSource] = useState<DataSource>('mock');

  const [activeProject, setActiveProjectState] = useState<Project>(() => {
    const savedId = localStorage.getItem(LS_KEY);
    return MOCK_PROJECTS.find(p => p.id === savedId) ?? MOCK_PROJECTS[0];
  });

  // Try to load projects from API on mount
  useEffect(() => {
    const cached = localStorage.getItem('cs_projects_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Project[];
        if (parsed.length > 0) {
          setProjects(parsed);
          setDataSource('cached');
        }
      } catch { /* ignore corrupt cache */ }
    }

    fetch(api.projects)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((body: { ok: boolean; data: Project[] }) => {
        if (body.ok && body.data.length > 0) {
          setProjects(body.data);
          setDataSource('live');
          localStorage.setItem('cs_projects_cache', JSON.stringify(body.data));
        }
      })
      .catch(() => { /* keep current source (mock or cached) */ });
  }, []);

  const setActiveProject = useCallback((project: Project) => {
    localStorage.setItem(LS_KEY, project.id);
    setActiveProjectState(project);
  }, []);

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, allProjects: projects, dataSource }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
}
