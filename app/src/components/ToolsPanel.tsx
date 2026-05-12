import { AVAILABLE_TOOLS, type ToolMode } from "../types/tools";
import '../styles/sandbox.css'

interface ToolsPanelProps {
  activeMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ activeMode, onModeChange }) => {
  return (
    <div className="tools-panel">
      {AVAILABLE_TOOLS.map((tool) => (
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
    </div>
  );
};