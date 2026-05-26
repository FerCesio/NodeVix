import { PRESETS } from '../../sandbox/presets';
import '../../styles/sandbox.css';

interface StructuresSectionProps {
  onGenerate: (presetId: string) => void;
}

export const StructuresSection: React.FC<StructuresSectionProps> = ({ onGenerate }) => {
  return (
    <>
      {PRESETS.map(preset => (
        <button
          key={preset.id}
          className="tool-button"
          onClick={() => onGenerate(preset.id)}
          title={preset.label}
        >
          <span className="tool-icon">{preset.icon}</span>
          <span className="tool-label">{preset.label}</span>
        </button>
      ))}
    </>
  );
};
