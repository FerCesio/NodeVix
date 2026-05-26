import { AVAILABLE_ALGORITHMS } from '../../sandbox/algorithms';
import '../../styles/sandbox.css';

interface AlgorithmsSectionProps {
  onRun: (algorithmId: string) => void;
}

export const AlgorithmsSection: React.FC<AlgorithmsSectionProps> = ({ onRun }) => {
  return (
    <>
      {AVAILABLE_ALGORITHMS.map(alg => (
        <button
          key={alg.id}
          className="tool-button"
          onClick={() => onRun(alg.id)}
          title={alg.label}
        >
          <span className="tool-icon">{alg.icon}</span>
          <span className="tool-label">{alg.label}</span>
        </button>
      ))}
    </>
  );
};
