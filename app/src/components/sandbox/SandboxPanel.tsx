import { useState } from 'react';
import { AVAILABLE_TOOLS, type PanelSection, type ToolMode } from '../../types/tools';
import '../../styles/sandbox.css';

interface SandboxPanelProps {
  activeMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
}

const SECTIONS: { id: PanelSection; label: string; icon: string }[] = [
  { id: 'TOOLS', label: 'Tools', icon: '🔧' },
  { id: 'STRUCTURES', label: 'Structures', icon: '📐' },
  { id: 'ALGORITHMS', label: 'Algorithms', icon: '⚡' },
];

export const SandboxPanel: React.FC<SandboxPanelProps> = ({ activeMode, onModeChange }) => {
  const [activeSection, setActiveSection] = useState<PanelSection>('TOOLS');

  const toggleSection = (section: PanelSection) => {
    setActiveSection(prev => prev === section ? section : section);
  };

  return (
    <div className="sandbox-panel">
      {SECTIONS.map(section => (
        <div key={section.id} className="panel-section">
          <button
            className={`section-tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => toggleSection(section.id)}
          >
            <span>{section.icon} {section.label}</span>
            <span className="tab-indicator">{activeSection === section.id ? '▼' : '▶'}</span>
          </button>

          {activeSection === section.id && (
            <div className="section-content">
              {section.id === 'TOOLS' && AVAILABLE_TOOLS.map(tool => (
                <button
                  key={tool.mode}
                  className={`tool-button ${activeMode === tool.mode ? 'active' : ''}`}
                  onClick={() => onModeChange(tool.mode)}
                  title={tool.label}
                >
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-label">{tool.label}</span>
                </button>
              ))}
              {section.id === 'STRUCTURES' && (
                <span className="section-placeholder">Próximamente</span>
              )}
              {section.id === 'ALGORITHMS' && (
                <span className="section-placeholder">Próximamente</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
