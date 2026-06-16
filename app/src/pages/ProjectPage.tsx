import { useEffect, useState, useRef } from "react";
import { api } from "../services/api";
import LoginForm from "../components/user/LoginForm";
import RegisterForm from "../components/user/RegisterForm";
import "../styles/general.css";
import toast, { Toaster } from "react-hot-toast";
import ReturnButton from "../components/general/ReturnButton";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { SimulationCanvas, type SimulationCanvasRef } from "../components/sandbox/SimulationCanvas";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

    // --- LÓGICA DE EXPORTACIÓN Y SHARE ---
    const handleShare = async () => {
        
        if (!id || id === "new") {
            toast.error("Please save the project before sharing!", { 
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            return;
        }

        const result = await Swal.fire({
            title: "Share Project",
            text: "Choose how you want to export or share your structure:",
            icon: "info",
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonColor: "#2ecc71", // Verde para PDF
            denyButtonColor: "#3498db",    // Azul para redes
            cancelButtonColor: "#888",
            confirmButtonText: "Export as PDF",
            denyButtonText: "Share to Socials",
            cancelButtonText: "Close",
            background: "#1a1a1a",
            color: "#fff",
        });

        if (result.isConfirmed) {
            exportToPDF();
        } else if (result.isDenied) {
            shareToSocials();
        }
    };

    const exportToPDF = async () => {
        // Buscamos el div contenedor del canvas
        const element = document.getElementById("canvas-export-container");
        if (!element) return;

        const loadingToast = toast.loading("Generando documento PDF de alta calidad...");

        try {
            // Capturamos el DOM con mayor escala para que los nodos no salgan pixelados
            const canvasImage = await html2canvas(element, {
                scale: 3, // Aumentamos la calidad
                useCORS: true,
                backgroundColor: "#1a1a1a" // Fondo de la captura
            });

            const imgData = canvasImage.toDataURL("image/png");
            
            // Creamos el PDF en A4 apaisado usando milímetros (más fácil para calcular márgenes de diseño)
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();   // 297 mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

            // 1. PINTAR EL FONDO DEL PDF COMPLETAMENTE OSCURO
            pdf.setFillColor(26, 26, 26); // RGB para #1a1a1a
            pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

            // 2. ENCABEZADO ELEGANTE
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(18);
            pdf.setTextColor(255, 255, 255); // Texto blanco
            const title = projectName || "NodeVix Simulation";
            pdf.text(title, 15, 20);

            // Línea separadora bajo el título
            pdf.setDrawColor(60, 60, 60); // Línea gris oscura
            pdf.setLineWidth(0.5);
            pdf.line(15, 25, pdfWidth - 15, 25);

            // 3. CÁLCULO DE ÁREA PARA LA IMAGEN (Con márgenes)
            const marginX = 15;
            const marginTop = 35; // Espacio libre para el título
            const marginBottom = 20; // Espacio libre para el pie de página
            
            const maxImgWidth = pdfWidth - (marginX * 2);
            const maxImgHeight = pdfHeight - marginTop - marginBottom;

            // Mantener la relación de aspecto sin deformar
            const imgWidth = canvasImage.width;
            const imgHeight = canvasImage.height;
            const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
            
            const renderWidth = imgWidth * ratio;
            const renderHeight = imgHeight * ratio;
            
            // Centrar la imagen en su caja contenedora
            const imgX = marginX + (maxImgWidth - renderWidth) / 2;
            const imgY = marginTop + (maxImgHeight - renderHeight) / 2;

            // 4. INSERTAR LA IMAGEN Y PONERLE UN MARCO SUTIL
            pdf.addImage(imgData, "PNG", imgX, imgY, renderWidth, renderHeight);
            
            pdf.setDrawColor(100, 100, 100); // Marco gris medio
            pdf.setLineWidth(0.3);
            pdf.rect(imgX, imgY, renderWidth, renderHeight);

            // 5. PIE DE PÁGINA (FOOTER)
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150); // Texto gris claro
            const dateStr = new Date().toLocaleDateString();
            pdf.text(`Exported from NodeVix platform on ${dateStr}`, 15, pdfHeight - 10);
            
            // Branding a la derecha
            pdf.setFont("helvetica", "italic");
            pdf.text("www.nodevix.app", pdfWidth - 15, pdfHeight - 10, { align: "right" });

            // Descargamos el archivo
            const fileName = projectName ? `${projectName.replace(/\s+/g, "_")}_NodeVix.pdf` : "NodeVix_Export.pdf";
            pdf.save(fileName);
            
            toast.success("PDF exportado con éxito!", { id: loadingToast });
        } catch (error) {
            console.error("PDF Export error:", error);
            toast.error("Error al generar el PDF.", { id: loadingToast });
        }
    };

    const shareToSocials = async () => {
        const projectUrl = window.location.href;
        const shareText = `Check out my simulation "${projectName || 'Structure'}" on NodeVix!`;

        // 1. Intentamos usar la Web Share API nativa (Magia pura en celulares y SO modernos)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'NodeVix Project',
                    text: shareText,
                    url: projectUrl
                });
                // Si funcionó y el usuario compartió, terminamos acá.
                return; 
            } catch (err: any) {
                // Si el usuario cerró el menú nativo sin compartir, lo ignoramos.
                if (err.name === 'AbortError') return;
                console.log("Error con el share nativo:", err);
            }
        }

        // 2. FALLBACK: Si no hay soporte nativo, abrimos un menú de SweetAlert hermoso
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(projectUrl);

        Swal.fire({
            title: 'Share Project',
            html: `
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
                    <a href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="background: #000; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px; border: 1px solid #333;">
                        𝕏 Share on X
                    </a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="background: #0A66C2; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px;">
                        Share on LinkedIn
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" style="background: #25D366; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px;">
                        Share on WhatsApp
                    </a>
                    <button id="copy-link-btn" style="background: #333; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 16px;">
                        Copy Link
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            background: "#1a1a1a",
            color: "#fff",
            // Le inyectamos la lógica al botón de "Copiar Link" usando el ciclo de vida de SweetAlert
            didOpen: () => {
                const copyBtn = document.getElementById('copy-link-btn');
                if (copyBtn) {
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(projectUrl);
                        toast.success("Link copied to clipboard!");
                        Swal.close();
                    };
                }
            }
        });
    };

    return (
        <div className="main-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', padding: 0, height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Toaster/>
            
            {/* NUEVA ESTRUCTURA DEL TOPBAR: Ahora usa Flexbox para tener elementos a izq y derecha */}
            <div style={{ 
                position: 'absolute', 
                top: '20px', 
                left: '20px', 
                right: '20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                zIndex: 10,
                pointerEvents: 'none'
            }}>
                <div className="nav-save-group" style={{ margin: 0, pointerEvents: 'auto' }}>
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

                {/* BOTÓN SHARE A LA DERECHA */}
                <div className="nav-share-group" style={{ pointerEvents: 'auto' }}>
                    <button className="btn btn-return" onClick={handleShare} style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: '130px' }}>
                        <span>Share ↗</span>
                    </button>
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
                // Envolvemos el canvas en este DIV con ID explícito para que html2canvas sepa qué parte capturar
                <div id="canvas-export-container" style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
                    <SimulationCanvas ref={canvasRef} initialData={projectContent} />
                </div>
            )}
        </div>
    );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const closeButtonStyle: React.CSSProperties = { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const linkButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#000', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px' };