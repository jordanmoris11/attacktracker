import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './ui/layout/MainLayout';
import { GraphCanvas } from './ui/features/GraphCanvas/GraphCanvas';
import { AnimationControls } from './ui/features/Animation/AnimationControls';
import { AttackDetailsPanel } from './ui/features/AttackDetails';
import { MatrixExplorer } from './ui/features/MatrixExplorer/MatrixExplorer';
import { useScenarioStore } from './core/store/useScenarioStore';
import { FileLoader } from './ui/pages/FileLoader';
import { GraphPage } from './ui/pages/GraphPage';

// Component that handles the default view logic
const DefaultView: React.FC = () => {
  const loadScenario = useScenarioStore(state => state.loadScenario);

  // Load Sample Data on Mount
  useEffect(() => {
    // New Scenario JSON equivalent to the user's test
    const sampleScenario = {
      "title": "Attacker DMZ Scenario",
      "description": "Simulation of an external attacker pivoting through a DMZ container to a sensitive internal database.",
      "version": "2.0",
      "viewport": { "zoom": 1, "pan": { "x": 0, "y": 0 } },
      "entities": [
        { "id": "attacker", "label": "External Attacker", "type": "node", "icon": "IconAttacker", "position": { "x": 50, "y": 150 } },
        { "id": "edge_firewall", "label": "Edge Firewall", "type": "node", "icon": "IconFirewall", "position": { "x": 200, "y": 150 } },
        { "id": "dmz_zone", "label": "DMZ Segment", "type": "container", "icon": "IconCloud", "position": { "x": 350, "y": 100 }, "width": 200, "height": 250, "style": "dashed_border", "members": ["web_server", "api_gateway"] },
        { "id": "web_server", "label": "Public Web Server", "type": "node", "icon": "IconServer", "position": { "x": 400, "y": 140 } },
        { "id": "api_gateway", "label": "API Gateway", "type": "node", "icon": "IconServer", "position": { "x": 400, "y": 240 } },
        { "id": "db_server", "label": "Sensitive DB", "type": "node", "icon": "IconDatabase", "position": { "x": 650, "y": 150 } },
        { "id": "alert_box", "label": "SIEM Alert", "type": "text_box", "icon": "IconAlert", "position": { "x": 350, "y": 400 } }
      ],
      "visibility": {
        "attacker": { "start": 0, "end": 10 },
        "edge_firewall": { "start": 0, "end": 10 },
        "dmz_zone": { "start": 1, "end": 10 },
        "web_server": { "start": 1, "end": 10 },
        "api_gateway": { "start": 1, "end": 10 },
        "db_server": { "start": 3, "end": 10 },
        "alert_box": { "start": 2, "end": 2 }
      },
      "steps": [
        { "id": 0, "type": "edge", "name": "Port Scan", "from": "attacker", "to": "edge_firewall", "icon": "IconSearch", "mitre": { "id": "T1595", "tactic": "Recon", "technique": "Active Scanning" } },
        { "id": 1, "type": "edge", "name": "Exploit Web App", "from": "attacker", "to": "web_server", "icon": "IconExploit", "mitre": { "id": "T1190", "tactic": "Initial Access", "technique": "Exploit Public-Facing App" } },
        { "id": 2, "type": "show_text", "name": "Detection Alert", "target_entity": "alert_box", "content": "Malicious SQL syntax detected.", "style": "warning_alert", "mitre": { "id": "DS0015", "tactic": "Detection", "technique": "Traffic Analysis" } },
        { "id": 3, "type": "edge", "name": "Access Database", "from": "web_server", "to": "db_server", "icon": "IconDatabase" },
        { "id": 4, "type": "edge", "name": "Exfiltrate via API", "from": "db_server", "to": "api_gateway", "icon": "IconData", "mitre": { "id": "T1048", "tactic": "Exfiltration", "technique": "Exfiltration Over Alt Protocol" } }
      ]
    };

    // Small delay to ensure hydration
    setTimeout(() => loadScenario(JSON.stringify(sampleScenario)), 100);
  }, [loadScenario]);

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
            <Route path="/:id" element={<GraphPage />} />
          </Routes>

          {/* Animation Controls (Bottom Left) */}
          <div className="absolute bottom-6 left-6 pointer-events-auto z-50">
            <AnimationControls />
          </div>

          {/* Attack Details Panel (Floating, Bottom Right) */}
          <AttackDetailsPanel />
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
