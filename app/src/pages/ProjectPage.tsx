import ProjectCreationForm from "../components/ProjectCreationForm";

export default function ProjectPage() {
  return (
    <div 
      style={{ 
        backgroundColor: "black", 
        color: "white", 
        minHeight: "100vh", 
        margin: 0, 
        padding: 0 
      }}
    >
      {/* Contenedor para ubicar el formulario arriba a la izquierda 
        sin estilos CSS externos 
      */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "flex-start", 
          alignItems: "flex-start", 
          padding: "20px" 
        }}
      >
        {/* Insertamos el componente crudo */}
        <ProjectCreationForm /> 
      </div>
    </div>
  );
}