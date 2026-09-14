import ConstellationGrid from '@/components/ui/constellation-grid'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Workspace from './components/Workspace';
import ComponentsPage from './components/ComponentsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConstellationGrid />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/components" element={<ComponentsPage />} />
      </Routes>
    </BrowserRouter>
  );
}