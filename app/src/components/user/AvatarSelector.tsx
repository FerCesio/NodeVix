import { useState } from "react";
import { AVATAR_LIST } from "../../utils/avatars";

interface AvatarSelectorProps {
  selectedAvatar: string; // Ej: "avatar_0.png"
  onSelect: (avatarName: string) => void;
}

export default function AvatarSelector({ selectedAvatar, onSelect }: AvatarSelectorProps) {
  
  const [isExpanded, setIsExpanded] = useState(false);
  // Intentamos buscar el seleccionado, si no, usamos el primero de la lista
  const currentAvatarObj = AVATAR_LIST.find(a => a.id === selectedAvatar) || AVATAR_LIST[0];

  const handleSelect = (avatar: string) => {
    onSelect(avatar);
    setIsExpanded(false); // Contraer al seleccionar
  };

  return (
    <div className="avatar-selector-wrapper" style={{ marginBottom: "30px", textAlign: "center" }}>
      <label style={{ fontSize: "14px", fontWeight: "bold", color: "#666", display: "block", marginBottom: "15px" }}>
        {isExpanded ? "Choose your avatar" : "Profile Picture"}
      </label>

      {!isExpanded ? (
        /* VISTA CONTRAÍDA: Círculo central */
        <div 
          onClick={() => setIsExpanded(true)}
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            margin: "0 auto",
            cursor: "pointer",
            border: "3px solid var(--accent-color)",
            overflow: "hidden",
            transition: "transform 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <img 
            src={currentAvatarObj.img} 
            alt="Selected Avatar" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        /* VISTA EXPANDIDA: Grilla de opciones */
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "15px", 
          maxWidth: "300px",
          margin: "0 auto",
          padding: "10px",
          background: "rgba(0,0,0,0.05)",
          borderRadius: "15px"
        }}>
          {AVATAR_LIST.map(({ id, img }) => (
            <div
              key={id}
              onClick={() => handleSelect(id)}
              style={{
                cursor: "pointer",
                borderRadius: "50%",
                border: selectedAvatar === id ? "3px solid var(--accent-color)" : "3px solid transparent",
                overflow: "hidden",
                transition: "all 0.2s"
              }}
            >
              <img
                src={img} // Usamos la importación directa de Vite
                alt={id}
                style={{ width: "100%", display: "block" }}
              />
            </div>
          ))}
        </div>
      )}
      
      {isExpanded && (
        <button 
          onClick={() => setIsExpanded(false)}
          style={{ 
            marginTop: "10px", 
            background: "none", 
            border: "none", 
            color: "var(--accent-color)", 
            cursor: "pointer",
            fontSize: "12px" 
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}