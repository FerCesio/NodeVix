import { useRef } from 'react';
import { AVAILABLE_ALGORITHMS } from '../../sandbox/algorithms';
import '../../styles/sandbox.css';

interface AlgorithmsSectionProps {
  onRun: (algorithmId: string) => void;
}

export const AlgorithmsSection: React.FC<AlgorithmsSectionProps> = ({ onRun }) => {
  const draggingRef = useRef<string | null>(null);
  const ghostRef = useRef<HTMLElement | null>(null);

  const startDrag = (algId: string, icon: string, e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = algId;
    onRun(algId);
    const btn = e.currentTarget as HTMLElement;
    btn.classList.add('dragging');

    const ghost = document.createElement('img');
    ghost.className = 'drag-ghost';
    ghost.src = icon;
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
        onRun('__cancel__');
      }
      cleanup();
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onRun('__cancel__');
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
      {AVAILABLE_ALGORITHMS.map(alg => (
        <button
          key={alg.id}
          className="tool-button"
          onMouseDown={(e) => startDrag(alg.id, alg.icon, e)}
          title={alg.label}
        >
          <img src={alg.icon} alt={alg.label} className="tool-icon-img" />
          <span className="tool-label">{alg.label}</span>
        </button>
      ))}
    </>
  );
};
