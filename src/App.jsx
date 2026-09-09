import ConstellationGrid from '@/components/ui/constellation-grid'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Workspace from './components/Workspace';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConstellationGrid />} />
        <Route path="/workspace" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  );
}