import { useEffect } from 'react';
import '../../styles/property-panel.css'; 
import type { INode } from '../../sandbox/interfaces';
import { ColorWheel } from './ColorWheel';

interface PropertyPanelProps {
  node: INode | null;
  onUpdate: (updatedFields: Partial<INode>) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ node, onUpdate, onClose }) => {
  useEffect(() => {
    if (!node) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [node, onClose]);

  if (!node) return null;

  return (
    <div className="property-panel-container">
      <div className="property-panel-header">
        <h3>Node Inspector</h3>
        <button className="close-panel-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="property-panel-content">
        <div className="property-group">
          <label>Value</label>
          <input
            type="number"
            className="no-spinners"
            value={node.value ?? 0} 
            onChange={(e) => onUpdate({ value: Number(e.target.value) })}
          />
        </div>

        <div className="property-group">
          <label>Color</label>
          <ColorWheel
            value={node.color ?? '#2ecc71'}
            onChange={(color) => onUpdate({ color })}
            size={175}
          />
        </div>

        <div className="property-group">
          <label>Scale</label>
          <div className="range-wrapper">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={node.scale ?? 1}
              onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
            />
            <span>{node.scale ?? 1}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};
