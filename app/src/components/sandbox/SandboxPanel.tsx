import { useState, useEffect } from 'react';
import { AVAILABLE_TOOLS, type PanelSection, type ToolMode } from '../../types/tools';
import { StructuresSection } from './StructuresSection';
import { AlgorithmsSection } from './AlgorithmsSection';
import '../../styles/sandbox.css';

interface SandboxPanelProps {
  activeMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onGeneratePreset: (presetId: string) => void;
  onRunAlgorithm: (algorithmId: string) => void;
}

const SECTIONS: { id: PanelSection; icon: string }[] = [
  { id: 'TOOLS', icon: '🔧' },
  { id: 'STRUCTURES', icon: '📐' },
  { id: 'ALGORITHMS', icon: '⚡' },
];

export const SandboxPanel: React.FC<SandboxPanelProps> = ({ activeMode, onModeChange, onGeneratePreset, onRunAlgorithm }) => {
  const [activeSection, setActiveSection] = useState<PanelSection | null>('TOOLS');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const tool = AVAILABLE_TOOLS.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) onModeChange(tool.mode);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onModeChange]);

  const toggleSection = (section: PanelSection) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  return (
    <div className="sandbox-panel">
      <div className="panel-tabs">
        {SECTIONS.map(section => (
          <button
            key={section.id}
            className={`panel-tab-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => toggleSection(section.id)}
            title={section.id}
          >
            {section.icon}
          </button>
        ))}
      </div>

      <div className={`panel-content ${activeSection ? 'open' : ''}`}>
        {activeSection === 'TOOLS' && AVAILABLE_TOOLS.map(tool => (
          <button
            key={tool.mode}
            className={`tool-button ${activeMode === tool.mode ? 'active' : ''}`}
            onClick={() => onModeChange(tool.mode)}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
            <kbd className="tool-shortcut">{tool.shortcut}</kbd>
          </button>
        ))}
        {activeSection === 'STRUCTURES' && (
          <StructuresSection onGenerate={onGeneratePreset} />
        )}
        {activeSection === 'ALGORITHMS' && (
          <AlgorithmsSection onRun={onRunAlgorithm} />
        )}
      </div>
    </div>
  );
};
