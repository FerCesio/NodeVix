import type { StructureFlag } from '../../types/structure';
import '../../styles/sandbox.css';

interface FlagsPanelProps {
  flags: StructureFlag[];
}

export const FlagsPanel: React.FC<FlagsPanelProps> = ({ flags }) => {
  if (flags.length === 0) return null;

  return (
    <div className="flags-panel">
      {flags.map(flag => (
        <span key={flag} className="flag-badge">{flag}</span>
      ))}
    </div>
  );
};
