import { useState, useEffect } from "react";
import { api } from "../services/api";
import "../styles/userProjects.css";

import type { ReadListResponse, UpdateProject, UpdateResponse } from "../types/project";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function ProjectsBrowse() {
 
    const [projects, setProjects] = useState<ReadListResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Dentro de ProjectsBrowse
    const deleteProject = async (projectId: number) => {
        try {
            await api.delete(`/manage/${projectId}`);
            // ACTUALIZACIÓN DE ESTADO (Sustituye a removeProjectFromState)
            setProjects((prev) => prev.filter(p => p.id !== projectId));
            return true;
        } catch (error) {
            console.error("Error al eliminar:", error);
            return false;
        }
    };
    
    const fetchProjects = async () => {
        try {
            setLoading(true);
            // El interceptor ya manda el token, el back sabe quién es el usuario
            const response = await api.get<ReadListResponse[]>("/manage"); 
            console.log("Respuesta:", response.data);
            setProjects(response.data);

               
        } catch (error) {
            console.error("Error cargando proyectos:", error);
        } finally {
            setLoading(false);
        }
    };

    // 4. Se ejecuta una sola vez al montar el componente
    useEffect(() => {
        fetchProjects();
    }, []);
    
    // Ordenamos por fecha de modificación (más recientes primero)
    const sortedProjects = [...projects].sort((a, b) => {
        // 1. Separamos la fecha de la hora usando el espacio
        // "dd/MM/yyyy HH:mm:ss" -> ["dd/MM/yyyy", "HH:mm:ss"]
        const [datePartA, timePartA] = a.modifiedOn.split(" ");
        const [datePartB, timePartB] = b.modifiedOn.split(" ");

        // 2. Dividimos la fecha por "/" y la hora por ":"
        const [dayA, monthA, yearA] = datePartA.split("/").map(Number);
        const [dayB, monthB, yearB] = datePartB.split("/").map(Number);
        
        const [hA, minA, sA] = timePartA.split(":").map(Number);
        const [hB, minB, sB] = timePartB.split(":").map(Number);

        // 3. Creamos los objetos Date (Mes es 0-11)
        const dateA = new Date(yearA, monthA - 1, dayA, hA, minA, sA).getTime();
        const dateB = new Date(yearB, monthB - 1, dayB, hB, minB, sB).getTime();

        // 4. B - A para orden descendente (más nuevo arriba)
        return dateB - dateA;
    });

    if (loading) return <div className="loader">Cargando proyectos...</div>;

    return (
        <div className="projects-container">
            <h1>My projects</h1>
            <form onSubmit={(e) => e.preventDefault()}>
                <input name="searched" placeholder="Search..." className="search-input" />
            </form>
            
            <div className="projects-list">
                {sortedProjects.length > 0 ? (
                    sortedProjects.map((item) => (
                        <ProjectCard 
                            key={item.id} 
                            project={item} 
                            onDelete={deleteProject} // <-- Nueva prop
                        />
                    ))
                ) : (
                    <p>You don't have any projects yet</p>
                )}
            </div>

            <button className="btn" onClick={() => window.location.href = "/project"}>
                <span>Create Project</span>
            </button>
            <button className="btn" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("userId"); window.location.href = "/login";}}>
                <span>Log out</span>
            </button>
        </div>

    );
    
}

interface ProjectCardProps {
    project: any; // O ReadListResponse si lo tienes importado
    onDelete: (projectId: number) => Promise<boolean>;
}

function ProjectCard({ project, onDelete }: ProjectCardProps) {
    const displayDate = project.modifiedOn ? project.modifiedOn.substring(0, 10) : "Sin fecha";
    // Estados para controlar la edición
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: project.name,
        description: ""
    });
    
    const handleSave = async () => {
        const loadingToast = toast.loading("Actualizando proyecto...");

        try {
            // Definimos el payload respetando el tipo UpdateProject
            // Si no estás editando el 'content' ahora mismo, mandamos un objeto vacío
            const payload: UpdateProject = {
                name: editForm.name,
                description: editForm.description,
                content: project.content // Mantenemos el contenido existente
            };

            const res = await api.put<UpdateResponse>(`/manage/${project.id}`, payload);
            
            // Éxito
            toast.success("¡Cambios guardados!", { id: loadingToast });
            setIsEditing(false);
            
            console.log(res.status);
            if (res.status) {
                project.name = editForm.name
                project.description = editForm.description
            }
            
            /* IMPORTANTE: 
            Para que la UI se actualice (el nombre en la card y la fecha),
            lo ideal es que el componente padre refresque la lista o 
            que tú actualices un estado local si 'project' viene de un useState.
            */
            
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Error al conectar con el servidor";
            toast.error(msg, { id: loadingToast });
        }
    };
  
    
    const handleCancel = () => {
        setEditForm({
            name: project.name,
            description: project.description || ""
        });
        setIsEditing(false);
    };
    
    const handleDeleteClick = () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar el proyecto "${project.name}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a', // Ajusta al color de tu app
            color: '#fff'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const success = await onDelete(project.id);
                if (success) {
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'El proyecto ha sido borrado.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire('Error', 'No se pudo eliminar el proyecto.', 'error');
                }
            }
        });
    };
    
    return (
        <div className="project-card wide">
            <div className="project-info">
                {isEditing ? (
                    <div className="edit-mode-container">
                        <input 
                            className="edit-input name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        />
                        <input 
                            className="edit-input desc"
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        />
                    </div>
                ) : (
                    <>
                        <h3>{project.name}</h3>
                        <p className="project-desc">{project.description || "No description available."}</p>
                    </>
                )}
                <div className="project-card-footer">
                    <span className="project-id">ID: {project.id}</span>
                    <span className="project-date">{displayDate}</span>
                </div>
            </div>

            {/* Contenedor ahora con clase vertical */}
            <div className="project-actions-vertical">
                {isEditing ? (
                    <>
                        {/* Botón de Confirmar Guardado */}
                        <button className="action-btn save" onClick={handleSave} title="Guardar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        {/* Botón de Cancelar */}
                        <button className="action-btn cancel" onClick={() => handleCancel()} title="Cancelar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button className="action-btn enter" title="Entrar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </button>
                        <button className="action-btn edit" onClick={() => setIsEditing(true)} title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button 
                            className="action-btn delete" 
                            onClick={handleDeleteClick} 
                            title="Eliminar"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}


