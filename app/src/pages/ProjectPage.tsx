import { useEffect, useState } from "react";
import { api } from "../services/api";
import LoginForm from "../components/LoginForm"; // Tu formulario existente
import RegisterForm from "../components/RegisterForm"; // Tu formulario existente
import "../styles/general.css";
import type { CreateProject, UpdateProject } from "../types/project";
import toast, { Toaster } from "react-hot-toast";
import ReturnButton from "../components/ReturnButton";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import SimulationCanvas from "../components/SimulationCanvas";

export default function ProjectPage() {
    // 1. Capturamos el ID de la URL
    const { id } = useParams<{ id: string }>();
    
    useEffect(() => {
      // Si NO hay id, significa que estamos en /project/new
      if (!id) {
          console.log("Modo: Crear nuevo proyecto");
          setProjectName(""); // Empezamos limpio
          return;
      }

      // Si HAY id, significa que estamos en /project/:id
      const loadProject = async () => {
          try {
              const res = await api.get(`/manage/${id}`);
              
              // We get the info from the response
              setProjectName(res.data.name);
              setProjectDesc(res.data.description);
              setProjectContent(res.data.content);
              
          } catch (err) {
              toast.error("Project not found.");
              navigate("/home");
          }
      };
      
      loadProject();
    }, [id]); // Se dispara si el ID cambia
    
    const [projectName, setProjectName] = useState("");
    const [projectDesc, setProjectDesc] = useState("");
    const [projectContent, setProjectContent] = useState("");
    const [view, setView] = useState<'none' | 'auth'>('none');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const navigate = useNavigate();

    const handleSaveTrigger = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setView('auth');
            return;
        }

        const loadingToast = toast.loading(id ? "Updating..." : "Creating...");

        try {
            if (!id || id === "new") {
                // --- CASO: CREACIÓN ---
                // 1. Hacemos el POST y guardamos la respuesta
                const response = await api.post("/manage/create", { 
                    projectName: projectName 
                });

                // 2. Extraemos el ID que el Backend generó
                // (Asegúrate de que tu Backend devuelva el objeto creado o su ID)
                const newId = response.data.id; 

                toast.success("Project successfully created!", { id: loadingToast });

                // 3. CAMBIO DE RUTA SILENCIOSO:
                // En lugar de ir a /home, navegamos a la ruta de edición de este nuevo ID
                // El replace: true evita que el usuario pueda volver atrás a "/new"
                navigate(`/project/${newId}`, { replace: true });

            } else {
              
                // --- CASO: ACTUALIZACIÓN ---
                const updateProj: UpdateProject = {
                    name: projectName,
                    description: projectDesc,
                    content: projectContent // Mantenemos el contenido existente
                };
                
                await api.put(`/manage/${id}`, updateProj);
                
                toast.success("Changes saved", { id: loadingToast });
                 
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Error while saving", { id: loadingToast });
        }
    };
    
    const handleAuthSuccess = () => {
        setView('none');
        setIsLoggedIn(true);
        handleSaveTrigger();
    };
    
    const handlePublish = async () => {
      if (!id || id === "new") {
        toast.error("Save project before publishing");
        return;
      }

      const result = await Swal.fire({
        title: "Publish project?",
        text: "Once published, your project will be visible to the community.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0d0d0d",
        cancelButtonColor: "#888",
        confirmButtonText: "Yes, publish",
        cancelButtonText: "Cancel",
        background: "#1a1a1a",
        color: "#fff",
      });

      if (!result.isConfirmed) return;

      const loadingToast = toast.loading("Publishing...");

      try {
        await api.post(`/posts/create/${id}`);
        toast.success("Project published!", { id: loadingToast });
      } catch (err: any) {
        const msg = err.response?.data?.message || "Could not publish the project.";
        toast.error(msg, { id: loadingToast });
      }
    };
    
    return (
        <div className="main-container" style={{ flexDirection: 'column', gap: '20px' }}>
            <Toaster/>
            {/* Sección de Input de Proyecto */}
            <div className="top-left-nav">
             
              <div className="nav-save-group">
                  <button className="btn btn-return" onClick={() => window.location.assign("/home")}>
                    <span>Home</span>
                  </button>

                  <input 
                    className="nav-input" 
                    type="text" 
                    placeholder="Project Name..." 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                  <button className="btn btn-nav-save btn-return" onClick={handleSaveTrigger}>
                      <span>Save</span>
                  </button>
                  {isLoggedIn && (
                    <button className="btn btn-return" onClick={handlePublish}>
                      <span>Publish</span>
                    </button>
                  )}
              </div>
            </div>

            {/* Modal de Autenticación (Solo si view === 'auth') */}
            {view === 'auth' && (
              <div className="auth-overlay" style={overlayStyle}>
                <div className="basic-card" style={{ position: 'relative' }}>
                  <button onClick={() => setView('none')} style={closeButtonStyle}>
                    ✕
                  </button>

                  {authMode === 'login' ? (
                    <>
                      <h1>Welcome Back</h1>
                      <p>Login to save your project</p>
                      <LoginForm onSuccess={() => handleAuthSuccess()} />
                      <div className="footer-links" style={{ marginTop: '15px' }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          Don't have an account?{" "}
                          <button 
                            onClick={() => setAuthMode('register')} 
                            style={linkButtonStyle}
                          >
                            Register
                          </button>
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1>Create Account</h1>
                      <p>Join us to manage your projects</p>
                      <RegisterForm onSuccess={() => handleAuthSuccess()}/>
                      <div className="footer-links" style={{ marginTop: '15px' }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          Already have an account?{" "}
                          <button 
                            onClick={() => setAuthMode('login')} 
                            style={linkButtonStyle}
                          >
                            Login
                          </button>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <SimulationCanvas/>
            
        </div>
    );
}

// Estilos rápidos para el overlay del formulario
const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer'
};

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#000', // O el color de énfasis de tu página
  textDecoration: 'underline',
  cursor: 'pointer',
  fontWeight: 'bold',
  padding: 0,
  fontSize: '14px'
};