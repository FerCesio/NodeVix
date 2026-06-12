import React, { useState, useEffect, useRef } from 'react';
import '../../styles/property-panel.css'; 
import type { INode } from '../../sandbox/interfaces';

interface PropertyPanelProps {
  node: INode | null;
  onUpdate: (updatedFields: Partial<INode>) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ node, onUpdate, onClose }) => {
  // --- LÓGICA DE ARRASTRE (DRAG & DROP) ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panelStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Calculamos la distancia que se movió el mouse desde el clic inicial
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      // Actualizamos la posición sumando esa distancia
      setPosition({
        x: panelStart.current.x + dx,
        y: panelStart.current.y + dy
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    // Escuchamos el evento en toda la ventana para que no se "suelte" si movés el mouse muy rápido
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
    // Si hace clic justo en el botón de cerrar, no iniciamos el arrastre
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return;
    
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panelStart.current = { ...position };
  };

  // --- FIN LÓGICA DE ARRASTRE ---

  if (!node) return null;

  const handleWeightChange = (index: number, newWeight: number) => {
    if (!node.edges) return;
    const newEdges = [...node.edges];
    newEdges[index] = { ...newEdges[index], weight: newWeight };
    onUpdate({ edges: newEdges });
  };

  return (
    <div 
      className="property-panel-container"
      style={{ 
        // Aplicamos la traslación calculada por encima del CSS original
        transform: `translate(${position.x}px, ${position.y}px)`, 
        transition: isDragging ? 'none' : 'transform 0.1s ease-out' 
      }}
    >
      <div 
        className="property-panel-header"
        onMouseDown={handleMouseDown}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none' // Evita que el texto se resalte al arrastrar
        }}
      >
        <h3>Node Inspector</h3>
        <button className="close-panel-btn" onClick={onClose} style={{ cursor: 'pointer' }}>×</button>
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

        {node.edges && node.edges.length > 0 && (
          <div className="property-group">
            <label>Rutas Conectadas (Pesos)</label>
            <div className="edges-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
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