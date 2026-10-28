import ConstellationGrid from '@/components/ui/constellation-grid';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Workspace from './components/Workspace';
import ComponentsPage from './components/ComponentsPage';
import WorksPage from './components/WorksPage';
import GithubPage from './components/GithubPage';
import GithubCallbackPage from './components/GithubCallbackPage';
import NotFoundPage from './components/NotFoundPage';
import PublishedPage from './components/PublishedPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConstellationGrid />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/components" element={<ComponentsPage />} />
        <Route path="/components/*" element={<ComponentsPage />} />
        <Route path="/works" element={<WorksPage />} />
        <Route path="/deployed/:slug" element={<PublishedPage />} />
        <Route path="/github" element={<GithubPage />} />
        <Route path="/github/callback" element={<GithubCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
