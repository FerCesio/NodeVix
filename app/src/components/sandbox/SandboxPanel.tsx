import { useState, useEffect } from 'react';
import { AVAILABLE_TOOLS, type PanelSection, type ToolMode } from '../../types/tools';
import { StructuresSection } from './StructuresSection';
import { AlgorithmsSection } from './AlgorithmsSection';
import '../../styles/sandbox.css';

import structuresIcon from '../../assets/icons/structures.png';
import algorithmsIcon from '../../assets/icons/algorithms.png';

interface SandboxPanelProps {
  activeMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onGeneratePreset: (presetId: string) => void;
  onRunAlgorithm: (algorithmId: string) => void;
}

const SECTIONS: { id: PanelSection; icon: string }[] = [
  { id: 'STRUCTURES', icon: structuresIcon },
  { id: 'ALGORITHMS', icon: algorithmsIcon },
];

export const SandboxPanel: React.FC<SandboxPanelProps> = ({ activeMode, onModeChange, onGeneratePreset, onRunAlgorithm }) => {
  const [activeSection, setActiveSection] = useState<PanelSection | null>(null);

  const toggleSection = (section: PanelSection) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const tool = AVAILABLE_TOOLS.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) onModeChange(tool.mode);
      if (e.key === '1') toggleSection('STRUCTURES');
      if (e.key === '2') toggleSection('ALGORITHMS');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onModeChange]);

  return (
    <>
      {/* Tools toolbar - bottom left */}
      <div className="tools-bar">
        {AVAILABLE_TOOLS.map(tool => (
          <button
            key={tool.mode}
            className={`tools-bar-btn ${activeMode === tool.mode ? 'active' : ''}`}
            onClick={() => onModeChange(tool.mode)}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <img src={tool.icon} alt={tool.label} className="tools-bar-icon" />
            <kbd className="tools-bar-kbd">{tool.shortcut}</kbd>
          </button>
        ))}
      </div>

      {/* Structures/Algorithms panel - left center */}
      <div className="sandbox-panel">
        <div className="panel-tabs">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              className={`panel-tab-btn ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => toggleSection(section.id)}
              title={section.id}
            >
              <img src={section.icon} alt={section.id} width={28} height={28} />
            </button>
          ))}
        </div>

        <div className={`panel-content ${activeSection ? 'open' : ''}`}>
          {activeSection === 'STRUCTURES' && (
            <StructuresSection onGenerate={onGeneratePreset} />
          )}
          {activeSection === 'ALGORITHMS' && (
            <AlgorithmsSection onRun={onRunAlgorithm} />
          )}
        </div>
      </div>
    </>
  );
};
