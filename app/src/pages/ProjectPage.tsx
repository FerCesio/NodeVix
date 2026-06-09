import { useEffect, useState, useRef } from "react";
import { api } from "../services/api";
import LoginForm from "../components/user/LoginForm";
import RegisterForm from "../components/user/RegisterForm";
import "../styles/general.css";
import type { CreateProject, UpdateProject } from "../types/project";
import toast, { Toaster } from "react-hot-toast";
import ReturnButton from "../components/general/ReturnButton";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { SimulationCanvas, type SimulationCanvasRef } from "../components/sandbox/SimulationCanvas";

export default function ProjectPage() {
    const { id } = useParams<{ id: string }>();
    const canvasRef = useRef<SimulationCanvasRef>(null);

    const [projectName, setProjectName] = useState("");
    const [projectDesc, setProjectDesc] = useState("");
    const [projectContent, setProjectContent] = useState("");
    const [loading, setLoading] = useState(true); 

    const [view, setView] = useState<'none' | 'auth'>('none');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const navigate = useNavigate();

    // Bloqueamos el scroll de la página mientras el usuario está en el canvas
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
      if (!id || id === "new") {
          console.log("Modo: Crear nuevo proyecto");
          setProjectName("");
          setProjectContent("");
          setLoading(false);
          return;
      }

      const loadProject = async () => {
          try {
              const res = await api.get(`/manage/${id}/content`);
              setProjectName(res.data.name);
              setProjectDesc(res.data.description);
              setProjectContent(res.data.content);
          } catch (err) {
              toast.error("Project not found.");
              navigate("/home");
          } finally {
              setLoading(false);
          }
      };
      
      loadProject();
    }, [id]);

    const handleSaveTrigger = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setView('auth');
            return;
        }

        const loadingToast = toast.loading(id ? "Updating..." : "Creating...");

        try {
            const canvasContent = canvasRef.current
                ? canvasRef.current.getCanvasState()
                : { nodes: [], links: [] };

            const payload = {
                name: projectName,
                description: projectDesc,
                content: JSON.stringify(canvasContent) 
            };
            

            if (!id || id === "new") {
                const response = await api.post("/manage/create", payload);
                const newId = response.data.id; 
                toast.success("Project successfully created!", { id: loadingToast });
                navigate(`/project/${newId}`, { replace: true });
            } else {
                await api.put(`/manage/${id}`, payload);
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
        <div className="main-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', padding: 0, height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Toaster/>
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
                          <button onClick={() => setAuthMode('register')} style={linkButtonStyle}>
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
                          <button onClick={() => setAuthMode('login')} style={linkButtonStyle}>
                            Login
                          </button>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff' }}>
                    <span>Loading project...</span>
                </div>
            ) : (
                <SimulationCanvas ref={canvasRef} initialData={projectContent} />
            )}
        </div>
    );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const closeButtonStyle: React.CSSProperties = { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const linkButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#000', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px' };