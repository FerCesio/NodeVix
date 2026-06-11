import React, { useEffect } from 'react';
import '../../styles/property-panel.css'; 
import type { INode } from '../../sandbox/interfaces';

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
          <label>Node ID</label>
          <input type="text" value={node.id} disabled className="disabled-input" />
        </div>

        <div className="property-group">
          <label>Value</label>
          <input
            type="number"
            value={node.value ?? 0} 
            onChange={(e) => onUpdate({ value: Number(e.target.value) })}
          />
        </div>

        <div className="property-group">
          <label>Color</label>
          <div className="color-picker-wrapper">
            <input
              type="color"
              value={node.color ?? '#2ecc71'}
              onChange={(e) => onUpdate({ color: e.target.value })}
            />
            <span>{node.color ?? '#2ecc71'}</span>
          </div>
        </div>

        <div className="property-group">
          <label>Scale (Size)</label>
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
