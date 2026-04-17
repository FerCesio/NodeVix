import { useState } from "react";
import { api } from "../services/api";
import LoginForm from "../components/LoginForm"; // Tu formulario existente
import RegisterForm from "../components/RegisterForm"; // Tu formulario existente
import "../styles/general.css";
import type { CreateProject } from "../types/project";
import { Toaster } from "react-hot-toast";
import ReturnButton from "../components/ReturnButton";

export default function ProjectPage() {
    const [projectName, setProjectName] = useState("");
    const [view, setView] = useState<'none' | 'auth'>('none');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    const handleSaveTrigger = () => {
        // A) Verificamos si existe el token en localStorage
        const token = localStorage.getItem("token");

        if (token) {
            // CASO A: El usuario está logueado
            console.log("Procediendo a guardar proyecto:", projectName);
            const newProject: CreateProject = {
                projectName: projectName 
            };
            
            api.post("/manage/create", newProject);
            
          } else {
            // CASO B: No hay sesión, abrimos el formulario
            setView('auth');
        }
        
    };
    
    const handleAuthSuccess = () => {
        setView('none');
        handleSaveTrigger();
    };

    return (
        <div className="main-container" style={{ flexDirection: 'column', gap: '20px' }}>
            <Toaster/>
            {/* Sección de Input de Proyecto */}
            <ReturnButton to="/home" />
            
            <div className="top-left-nav">
             
              <div className="nav-save-group">
                  <button className="btn btn-small" onClick={() => window.location.assign("/home")}>
                    <span>Go Home</span>
                  </button>

                  <input 
                    className="nav-input" 
                    type="text" 
                    placeholder="Project Name..." 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                  <button className="btn-nav-save" onClick={handleSaveTrigger}>
                      <span>Save</span>
                  </button>
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