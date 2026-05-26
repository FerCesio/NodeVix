import type { StructureInfo } from '../../sandbox/StructureManager';
import '../../styles/sandbox.css';

interface FlagsPanelProps {
  structures: StructureInfo[];
  selectedNodeId: string | null;
}

export const FlagsPanel: React.FC<FlagsPanelProps> = ({ structures, selectedNodeId }) => {
  if (!selectedNodeId) return null;

  const visible = structures.filter(s => s.nodeIds.includes(selectedNodeId));

  return (
    <div className="flags-panel">
      {visible.map((s, i) => (
        <div key={s.id} className="structure-group">
          {visible.length > 1 && <span className="structure-label">#{i + 1}</span>}
          {s.flags.map(flag => (
            <span key={flag} className="flag-badge">{flag}</span>
          ))}
        </div>
      ))}
    </div>
  );
};
