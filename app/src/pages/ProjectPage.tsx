import { useEffect, useState, useRef } from "react";
import { api } from "../services/api";
import LoginForm from "../components/user/LoginForm";
import RegisterForm from "../components/user/RegisterForm";
import "../styles/general.css";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { SimulationCanvas, type SimulationCanvasRef } from "../components/sandbox/SimulationCanvas";
import PageTransition from "../components/general/PageTransition";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function ProjectPage() {
    const { id } = useParams<{ id: string }>();
    const canvasRef = useRef<SimulationCanvasRef>(null);

    const [projectName, setProjectName] = useState("");
    const [projectDesc, setProjectDesc] = useState("");
    const [projectContent, setProjectContent] = useState("");
    const [loading, setLoading] = useState(true); 
    
    // NUEVO: Estado para guardar el rol del usuario en este proyecto
    const [userRole, setUserRole] = useState<string>("GUEST");

    const [view, setView] = useState<'none' | 'auth'>('none');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const navigate = useNavigate();
    const joinAttempted = useRef(false);
    
    // Evaluamos si el usuario actual NO es el dueño
    const isReadOnly = userRole === "GUEST";

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
            setProjectDesc("");
            setProjectContent("");
            setUserRole("OWNER"); // Si está creando uno nuevo, es el dueño indiscutido
            setLoading(false);
            return;
        }

        const loadProject = async () => {
            try {
                setLoading(true);
                // INTENTO 1: Pedimos el proyecto (Funciona si sos OWNER o si ya eras GUEST)
                const res = await api.get(`/manage/${id}/content`);
                
                setProjectName(res.data.name);
                setProjectDesc(res.data.description);
                setProjectContent(res.data.content);
                setUserRole(res.data.role || "GUEST"); // Seteamos el rol que viene del back
                
            } catch (err: any) {
            
                if (joinAttempted.current) return; 
                joinAttempted.current = true; // Levantamos la bandera en el primer intento
                
                try {
                    // PLAN B: Como dio error, le pegamos a tu endpoint que inserta el GUEST en la BD
                    await api.post(`/projects/${id}/accept-invitation`); // Asegurate que la ruta coincida con tu back
                    console.log("✅ Registro en tabla 'has' completado con éxito. Reintentando GET...");

                    // INTENTO 2: Ahora que el backend te registró, volvemos a pedir el contenido
                    const resRetry = await api.get(`/manage/${id}/content`);
                    
                    setProjectName(resRetry.data.name);
                    setProjectDesc(resRetry.data.description);
                    setProjectContent(resRetry.data.content);
                    setUserRole(resRetry.data.role || "GUEST"); // Al entrar por link, es GUEST
                    toast.success("¡Te has unido al proyecto compartido!");
                    
                } catch (joinErr: any) {
                    // PLAN C: Si cae acá, imprimimos el código y cuerpo exacto del error en la consola
                    console.error("❌ Error definitivo en el flujo colaborativo:", {
                        status: joinErr.response?.status,
                        data: joinErr.response?.data,
                        message: joinErr.message
                    });
            
                    toast.error("No tienes acceso a este proyecto.");
                    navigate("/home");
                }
            } finally {
                setLoading(false);
            }
        };
        
        loadProject();
    }, [id, navigate]);


    const handleManageCollaborators = async () => {
        if (!id) {
            toast.error("Save the project first before managing collaborators!");
            return;
        }
        // Función interna para disparar el prompt de agregar
        const triggerAdd = async () => {
            const { isConfirmed } = await Swal.fire({
                title: 'Agregar Colaborador',
                input: 'text',
                inputLabel: 'Username del usuario',
                inputPlaceholder: 'Ej: andres123',
                showCancelButton: true,
                confirmButtonText: 'Agregar',
                confirmButtonColor: '#2ecc71',
                cancelButtonColor: '#888',
                background: '#1a1a1a',
                color: '#fff',
                // Activa el loader nativo en el botón de confirmar
                showLoaderOnConfirm: true,
                preConfirm: async (username) => {
                    if (!username) {
                        Swal.showValidationMessage('¡Tenés que escribir un username!');
                        return false;
                    }

                    try {
                        // Intentamos hacer el POST al backend
                        await api.post(`/projects/${id}/collaborators`, { username });
                        return true; // Si sale bien, SweetAlert se cierra solo
                    } catch (error: any) {
                        // Si el backend falla (404, 400, etc.), quitamos el loader y mostramos el error
                        const errorMessage = error.response?.data?.message || "No se pudo encontrar o agregar al usuario.";
                        Swal.showValidationMessage(errorMessage);
                        return false; // Mantiene el modal abierto para corregir
                    }
                },
                allowOutsideClick: () => !Swal.isLoading()
            });

            // Si se completó con éxito
            if (isConfirmed) {
                toast.success("¡Colaborador agregado con éxito!");
                handleManageCollaborators(); // Reabre/actualiza la lista de colaboradores
            }
        };

        try {
            const res = await api.get(`/projects/${id}/collaborators`);
            const collaborators = res.data;
            
            const collaboratorsHtml = collaborators.map((c: any) => {
                const realUserId = c.userID ?? c.userId ?? c.id ?? c.user_id;
                const displayName = c.username || c.name || c.email || `Usuario #${realUserId}`;
                const isOwner = c.role === 'OWNER';
                
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: #222; border-radius: 8px;">
                        <div style="text-align: left;">
                            <strong style="color: #fff;">${displayName}</strong><br>
                            <small style="color: #aaa;">Rol actual: ${c.role}</small>
                        </div>
                        ${!isOwner ? `
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <select data-user-id="${realUserId}" class="modal-role-select" style="margin: 0; background: #333; color: #fff; border: 1px solid #444; padding: 5px; border-radius: 4px;">
                                    <option value="GUEST" ${c.role === 'GUEST' ? 'selected' : ''}>GUEST</option>
                                    <option value="EDITOR" ${c.role === 'EDITOR' ? 'selected' : ''}>EDITOR</option>
                                </select>
                                <button type="button" class="btn-delete-colab" data-user-id="${realUserId}" style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Eliminar colaborador">
                                    🗑️
                                </button>
                            </div>
                        ` : '<span style="color: #2ecc71; font-size: 12px; font-weight: bold;">PROPIETARIO</span>'}
                    </div>
                `;
            }).join('');

            const { isConfirmed, value: updates } = await Swal.fire({
                title: 'Manage Collaborators',
                html: `
                    <div style="margin-bottom: 15px; text-align: right;">
                        <button id="btn-open-add" type="button" style="background: #2ecc71; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">
                            + Add Collaborator
                        </button>
                    </div>
                    <div style="max-height: 250px; overflow-y: auto;">
                        ${collaboratorsHtml || '<p style="color:#aaa">No hay otros colaboradores.</p>'}
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Save Changes',
                confirmButtonColor: '#3498db',
                background: '#1a1a1a',
                color: '#fff',
                didOpen: () => {
                    const popup = Swal.getPopup();
                    if (popup) {
                        // Botón de abrir modal para agregar
                        const addBtn = document.getElementById('btn-open-add');
                        if (addBtn) {
                            addBtn.onclick = () => triggerAdd();
                        }

                        // Botones de eliminar colaborador
                        const deleteButtons = popup.querySelectorAll('.btn-delete-colab');
                        deleteButtons.forEach((btn: any) => {
                            btn.onclick = async () => {
                                const targetUserId = btn.getAttribute('data-user-id');
                                
                                const confirmDelete = await Swal.fire({
                                    title: '¿Eliminar colaborador?',
                                    text: 'Perderá el acceso al proyecto inmediatamente.',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#e74c3c',
                                    confirmButtonText: 'Sí, eliminar',
                                    cancelButtonText: 'Cancelar',
                                    background: '#1a1a1a',
                                    color: '#fff'
                                });

                                if (confirmDelete.isConfirmed && targetUserId) {
                                    try {
                                        
                                        await api.delete(`/projects/${id}/collaborators/${targetUserId}`);
                                        toast.success("Colaborador eliminado");
                                        Swal.close(); // Cerramos el modal para refrescar la lista
                                        handleManageCollaborators(); // Lo reabrimos actualizado
                                    } catch (error: any) {
                                        toast.error(error.response?.data?.message || "No se pudo eliminar al colaborador.");
                                    }
                                }
                            };
                        });
                    }
                },
                preConfirm: () => {
                    const popup = Swal.getPopup();
                    if (!popup) return [];

                    const selects = popup.querySelectorAll('.modal-role-select');
                    const collectedUpdates: any[] = [];

                    selects.forEach((select: any) => {
                        const realUserId = select.getAttribute('data-user-id');
                        const newRole = select.value;
                        if (realUserId) {
                            collectedUpdates.push({ realUserId, newRole });
                        }
                    });
                    return collectedUpdates;
                }
            });

            // Si guardó cambios de roles
            if (isConfirmed && updates && updates.length > 0) {
                const loadingToast = toast.loading("Updating permissions...");
                try {
                    for (const update of updates) {
                        await api.put(`/projects/${id}/collaborators/${update.realUserId}/role`, null, {
                            params: { role: update.newRole }
                        });
                    }
                    toast.success("Permissions updated!", { id: loadingToast });
                } catch (updateError: any) {
                    toast.error("Error al impactar los cambios en el servidor.");
                }
            }
        } catch (err: any) {
            toast.error("Error al cargar los colaboradores.");
        }
    };

    const handleSaveTrigger = async () => {
        // Bloqueo de seguridad extra por si logran destapar el botón
        if (isReadOnly) {
            toast.error("No tienes permisos para guardar cambios.");
            return;
        }

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
            confirmButtonColor: "#2ecc71", 
            denyButtonColor: "#3498db",    
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
        const element = document.getElementById("canvas-export-container");
        if (!element) return;

        const loadingToast = toast.loading("Generando documento PDF de alta calidad...");

        try {
            const canvasImage = await html2canvas(element, {
                scale: 3, 
                useCORS: true,
                backgroundColor: "#1a1a1a" 
            });

            const imgData = canvasImage.toDataURL("image/png");
            
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();   
            const pdfHeight = pdf.internal.pageSize.getHeight(); 

            pdf.setFillColor(26, 26, 26); 
            pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(18);
            pdf.setTextColor(255, 255, 255); 
            const title = projectName || "NodeVix Simulation";
            pdf.text(title, 15, 20);

            pdf.setDrawColor(60, 60, 60); 
            pdf.setLineWidth(0.5);
            pdf.line(15, 25, pdfWidth - 15, 25);

            const marginX = 15;
            const marginTop = 35; 
            const marginBottom = 20; 
            
            const maxImgWidth = pdfWidth - (marginX * 2);
            const maxImgHeight = pdfHeight - marginTop - marginBottom;

            const imgWidth = canvasImage.width;
            const imgHeight = canvasImage.height;
            const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
            
            const renderWidth = imgWidth * ratio;
            const renderHeight = imgHeight * ratio;
            
            const imgX = marginX + (maxImgWidth - renderWidth) / 2;
            const imgY = marginTop + (maxImgHeight - renderHeight) / 2;

            pdf.addImage(imgData, "PNG", imgX, imgY, renderWidth, renderHeight);
            
            pdf.setDrawColor(100, 100, 100); 
            pdf.setLineWidth(0.3);
            pdf.rect(imgX, imgY, renderWidth, renderHeight);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150); 
            const dateStr = new Date().toLocaleDateString();
            pdf.text(`Exported from NodeVix platform on ${dateStr}`, 15, pdfHeight - 10);
            
            pdf.setFont("helvetica", "italic");
            pdf.text("www.nodevix.app", pdfWidth - 15, pdfHeight - 10, { align: "right" });

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
        const shareTitle = projectName ? `Check out "${projectName}"` : "Check out my simulation";
        const shareText = `Check out "${projectName}" — built on NodeVix! 🧠🚀\n\n`;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (navigator.share && isMobile) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: projectUrl
                });
                return; 
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.log("Error con el share nativo:", err);
            }
        }

        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(projectUrl);
        const whatsappText = encodeURIComponent(`${shareTitle} - ${shareText} ${projectUrl}`);

        Swal.fire({
            title: 'Share Project',
            html: `
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
                    
                    <a href="https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="background: #000; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px; border: 1px solid #333;">
                        𝕏 Share on X
                    </a>
                    
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" style="background: #0A66C2; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px;">
                        Share on LinkedIn
                    </a>
                    
                    <a href="https://api.whatsapp.com/send?text=${whatsappText}" target="_blank" rel="noopener noreferrer" style="background: #25D366; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px;">
                        💬 Share on WhatsApp
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
            didOpen: () => {
                const copyBtn = document.getElementById('copy-link-btn');
                if (copyBtn) {
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(`${shareTitle} - ${shareText} ${projectUrl}`);
                        toast.success("Link copied to clipboard!", { icon: "📋" });
                        Swal.close();
                    };
                }
            }
        });
    };

    return (
        <PageTransition>
        <div className="main-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', padding: 0, height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Toaster/>
            
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
                <div className="nav-save-group" style={{ margin: 0, pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-return" onClick={() => window.location.assign("/home")}>
                        <span>Home</span>
                    </button>

                    {/* LÓGICA CONDICIONAL: Qué mostramos según si es dueño o visita */}
                    {!isReadOnly ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px", marginLeft: "10px" }}>
                                {projectName}
                            </span>
                            <span style={{ 
                                color: "#ccc", 
                                padding: "4px 10px", 
                                background: "rgba(50,50,50,0.8)", 
                                borderRadius: "12px", 
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}>
                                👁️ Solo Lectura
                            </span>
                        </>
                    )}
                </div>

                <div className="nav-share-group" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!isReadOnly && (
                        <button className="btn btn-return" onClick={handleManageCollaborators} title="Gestión de usuarios">
                            <span>Users</span>
                        </button>
                    )}
                        
                    <button className="btn btn-return" onClick={handleShare} style={{ display: 'flex', gap: '2px', alignItems: 'center', minWidth: '130px' }}>
                        <span>Share ↗</span>
                    </button>
                </div>
            </div>

            {view === 'auth' && (
              <div className="auth-overlay" style={overlayStyle}>
                <div className="basic-card" style={{ position: 'relative' }}>
                  <button onClick={() => setView('none')} style={closeButtonStyle}>✕</button>

                  {authMode === 'login' ? (
                    <>
                      <h1>Welcome Back</h1>
                      <p>Login to save your project</p>
                      <LoginForm onSuccess={() => handleAuthSuccess()} />
                      <div className="footer-links" style={{ marginTop: '15px' }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          Don't have an account?{" "}
                          <button onClick={() => setAuthMode('register')} style={linkButtonStyle}>Register</button>
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
                          <button onClick={() => setAuthMode('login')} style={linkButtonStyle}>Login</button>
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
                <div id="canvas-export-container" style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
                    {/* LE PASAMOS LA PROP AL COMPONENTE HIJO */}
                    <SimulationCanvas 
                        ref={canvasRef} 
                        initialData={projectContent} 
                        readOnly={isReadOnly} 
                    />
                </div>
            )}
        </div>
        </PageTransition>
    );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const closeButtonStyle: React.CSSProperties = { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const linkButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#000', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px' };