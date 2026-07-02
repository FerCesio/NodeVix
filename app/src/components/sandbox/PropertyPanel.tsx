import React, { useState, useEffect, useRef } from 'react';
import '../../styles/property-panel.css'; 
import type { INode } from '../../sandbox/interfaces';
import { ColorWheel } from './ColorWheel';

interface PropertyPanelProps {
  node: INode | null;
  onUpdate: (updatedFields: Partial<INode>) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ node, onUpdate, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panelStart = useRef({ x: 0, y: 0 });
  
  // ESTADO PARA EL INPUT DEL PUSH
  const [structureValue, setStructureValue] = useState<number>(0);

  useEffect(() => {
    if (!node) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [node, onClose]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({
        x: panelStart.current.x + dx,
        y: panelStart.current.y + dy
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panelStart.current = { ...position };
  };

  if (!node) return null;

  const handleWeightChange = (index: number, newWeight: number) => {
    if (!node.edges) return;
    const newEdges = [...node.edges];
    newEdges[index] = { ...newEdges[index], weight: newWeight };
    onUpdate({ edges: newEdges });
  };

  // Variable de control para saber si mostramos la interfaz especial
  const isStructure = (node as any).kind === 'stack' || (node as any).kind === 'queue';

  return (
    <div 
      className="property-panel-container"
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`, 
        transition: isDragging ? 'none' : 'transform 0.1s ease-out' 
      }}
    >
      <div 
        className="property-panel-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <h3>Node Inspector</h3>
        <button className="close-panel-btn" onClick={onClose} style={{ cursor: 'pointer' }}>×</button>
      </div>
      
      <div className="property-panel-content">
        
        {/* --- INTERFAZ ESPECIAL: STACK / QUEUE --- */}
        {isStructure && (
          <div className="property-group" style={{ background: '#2c3e50', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
            <label style={{ color: '#ecf0f1', fontWeight: 'bold' }}>
              {((node as any).kind || '').toUpperCase()} CONTROLS
            </label>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input
                type="number"
                className="no-spinners"
                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #555', background: '#222', color: '#fff' }}
                value={structureValue}
                onChange={(e) => setStructureValue(Number(e.target.value))}
              />
              <button 
                className="btn btn-small"
                style={{ backgroundColor: '#2ecc71', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => {
                  const currentElements = (node as any).elements || [];
                  onUpdate({ elements: [...currentElements, structureValue] } as any);
                  setStructureValue(0);
                }}
              >
                {(node as any).kind === 'queue' ? 'ENQUEUE' : 'PUSH'}
              </button>
              <button 
                className="btn btn-small"
                style={{ backgroundColor: '#e74c3c', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => {
                  const currentElements = [...((node as any).elements || [])];
                  if (currentElements.length === 0) return;
                  
                  if ((node as any).kind === 'stack') {
                    currentElements.pop(); // LIFO
                  } else {
                    currentElements.shift(); // FIFO
                  }
                  onUpdate({ elements: currentElements} as any);
                }}
              >
                {(node as any).kind === 'queue' ? 'DEQUEUE' : 'POP'}
              </button>
            </div>

            {/* Visualizador en miniatura para el panel */}
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: (node as any).kind === 'stack' ? 'column-reverse' : 'row', gap: '4px', overflowX: 'auto', paddingBottom: '5px' }}>
              {((node as any).elements || []).map((val: number, i: number) => (
                <div key={i} style={{ 
                  background: '#34495e', border: '1px solid #7f8c8d', padding: '4px 8px', 
                  minWidth: '30px', textAlign: 'center', borderRadius: '3px', color: '#ecf0f1', fontWeight: 'bold'
                }}>
                  {val}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- INTERFAZ NORMAL --- */}
        {/* Ocultamos el 'Value' principal si es una estructura */}
        {!isStructure && (
          <div className="property-group">
            <label>Value</label>
            <input
              type="number"
              className="no-spinners"
              value={node.value ?? 0} 
              onChange={(e) => onUpdate({ value: Number(e.target.value) })}
            />
          </div>
        )}

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

        {/* --- RUTAS Y PESOS --- */}
        {node.edges && node.edges.length > 0 && (
          <div className="property-group">
            <label>Rutas Conectadas (Pesos)</label>
            <div 
              className="edges-list" 
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}
            >
              {node.edges.map((edge, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#bdc3c7' }}>
                    Hacia: {edge.end.value} {edge.directed ? '(➡)' : '(↔)'}
                  </span>
                  <input
                    type="number"
                    style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #555', background: '#222', color: '#fff' }}
                    value={edge.weight ?? 1}
                    onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};