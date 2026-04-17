import { useNavigate } from "react-router-dom";
import "../styles/general.css";

interface ReturnButtonProps {
    to: string; // El endpoint a donde debe volver
}

export default function ReturnButton({ to }: ReturnButtonProps) {
    const navigate = useNavigate();

    return (
        <button 
            className="btn btn-small" 
            onClick={() => navigate(to)}
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 16px' // Ajuste leve para que luzca como botón de acción
            }}
        >
            {/* Icono de flecha sin palo (Chevron Left) */}
            <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            >
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            
            <span>Return</span>
        </button>
    );
}