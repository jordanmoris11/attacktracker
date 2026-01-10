import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './ui/layout/MainLayout';
import { GraphCanvas } from './ui/features/GraphCanvas/GraphCanvas';
import { AnimationControls } from './ui/features/Animation/AnimationControls';
import { MatrixExplorer } from './ui/features/MatrixExplorer/MatrixExplorer';
import { useGraphStore } from './core/store/useGraphStore';
import { FileLoader } from './ui/pages/FileLoader';

// Component that handles the default view logic
const DefaultView: React.FC = () => {
  const loadData = useGraphStore(state => state.loadData);

  // Load Sample Data on Mount
  useEffect(() => {
    const sampleGraph = `
         graph TD
             attacker[Attacker] -->|Exploit| web[Web Server]
             web -->|Pivot| db[Database]
             db -.->|Exfil| attacker
             subgraph DMZ
                 web
             end
             subgraph Internal
                 db
             end
         `;
    // Small delay to ensure hydration
    setTimeout(() => loadData(sampleGraph), 100);
  }, [loadData]);

  return <GraphCanvas />;
};

const AppContent: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-1 relative overflow-hidden">
        <MatrixExplorer />
        <div className="flex-1 relative flex flex-col">
          <Routes>
            <Route path="/" element={<DefaultView />} />
            <Route path="/file" element={<FileLoader />} />
          </Routes>
          <AnimationControls />
        </div>
      </div>
    </MainLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
