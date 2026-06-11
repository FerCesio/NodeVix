import { useRef } from 'react';
import { PRESETS } from '../../sandbox/presets';
import '../../styles/sandbox.css';

interface StructuresSectionProps {
  onGenerate: (presetId: string) => void;
}

export const StructuresSection: React.FC<StructuresSectionProps> = ({ onGenerate }) => {
  const draggingRef = useRef<string | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  const startDrag = (presetId: string, icon: string, e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = presetId;
    onGenerate(presetId); // Set pending ref immediately on drag start
    const btn = e.currentTarget as HTMLElement;
    btn.classList.add('dragging');

    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = icon;
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    const onMove = (ev: MouseEvent) => {
      if (ghostRef.current) {
        ghostRef.current.style.left = `${ev.clientX}px`;
        ghostRef.current.style.top = `${ev.clientY}px`;
      }
    };

    const onUp = (ev: MouseEvent) => {
      const target = ev.target as Element;
      if (!target.closest('.canvas-wrapper svg')) {
        onGenerate('__cancel__');
      }
      cleanup();
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onGenerate('__cancel__');
        cleanup();
      }
    };

    const cleanup = () => {
      btn.classList.remove('dragging');
      ghostRef.current?.remove();
      ghostRef.current = null;
      draggingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
  };

  return (
    <>
      {PRESETS.map(preset => (
        <button
          key={preset.id}
          className="tool-button"
          onMouseDown={(e) => startDrag(preset.id, preset.icon, e)}
          title={preset.label}
        >
          <span className="tool-icon">{preset.icon}</span>
          <span className="tool-label">{preset.label}</span>
        </button>
      ))}
    </>
  );
};
