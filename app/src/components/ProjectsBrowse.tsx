import { useState, useEffect } from "react";
import { api } from "../services/api";
import "../styles/userProjects.css";

import type { ReadListResponse, UpdateProject, UpdateResponse } from "../types/project";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function ProjectsBrowse() {
    const [projects, setProjects] = useState<ReadListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const deleteProject = async (projectId: number) => {
        try {
            // Llamada al endpoint sin /api como habías corregido
            await api.delete(`/manage/${projectId}`);
            setProjects((prev) => prev.filter(p => p.id !== projectId));
            return { success: true };
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            
            // Capturamos si el error es por seguridad (proyecto publicado)
            const serverMessage = error.response?.data || "Could not delete this project. Make sure to delete the post first.";
            return { success: false, message: serverMessage };
        }
    };

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get<ReadListResponse[]>("/manage"); 
            setProjects(response.data);
        } catch (error) {
            console.error("Error cargando proyectos:", error);
            toast.error("Error while loading project list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);
    
    // Orden descendente por fecha de modificación
    const sortedProjects = [...projects].sort((a, b) => {
        const [datePartA, timePartA] = a.modifiedOn.split(" ");
        const [datePartB, timePartB] = b.modifiedOn.split(" ");

        const [dayA, monthA, yearA] = datePartA.split("/").map(Number);
        const [dayB, monthB, yearB] = datePartB.split("/").map(Number);
        
        const [hA, minA, sA] = timePartA.split(":").map(Number);
        const [hB, minB, sB] = timePartB.split(":").map(Number);

        const dateA = new Date(yearA, monthA - 1, dayA, hA, minA, sA).getTime();
        const dateB = new Date(yearB, monthB - 1, dayB, hB, minB, sB).getTime();

        return dateB - dateA;
    });

    const filteredProjects = sortedProjects.filter((project) => {
        const term = searchTerm.toLowerCase();
        // Ajustamos las propiedades a 'name' y 'description' que usa tu ReadListResponse
        const name = (project.name || "").toLowerCase();
        const desc = (project.description || "").toLowerCase();
        
        return name.includes(term) || desc.includes(term);
    });
    
    if (loading) return <div className="loader">Cargando proyectos...</div>;

    return (
        <div className="projects-container">
            <h1>- My projects -</h1>
            {/* Sección de búsqueda mejorada */}
            <div className="search-section" style={{ marginBottom: "20px" }}>
                <input
                    className="search-input" // O "nav-community-input" según tu CSS
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="projects-list">
                {/* Usamos filteredProjects en lugar de sortedProjects */}
                {filteredProjects.length > 0 ? (
                    filteredProjects.map((item) => (
                        <ProjectCard 
                            key={item.id} 
                            project={item} 
                            onDelete={deleteProject} 
                        />
                    ))
                ) : (
                    <p>
                        {searchTerm 
                            ? `No projects found matching "${searchTerm}"` 
                            : "You don't have any projects yet"}
                    </p>
                )}
            </div>

            {/* BOTONES EN VERTICAL (Como estaban antes) */}
            <button className="btn" onClick={() => window.location.href = "/project/new"}>
                <span>Create Project</span>
            </button>
            
        </div>
    );
}

interface ProjectCardProps {
    project: ReadListResponse;
    onDelete: (projectId: number) => Promise<{ success: boolean; reason?: string; message?: string }>;
}

function ProjectCard({ project, onDelete }: ProjectCardProps) {
    const displayDate = project.modifiedOn ? project.modifiedOn.substring(0, 10) : "Sin fecha";
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: project.name,
        description: project.description || ""
    });
    
    const handleSave = async () => {
        const loadingToast = toast.loading("Updating project...");
        try {
            const payload: UpdateProject = {
                name: editForm.name,
                description: editForm.description,
                content: ""
            };

            await api.put<UpdateResponse>(`/manage/${project.id}`, payload);
            
            toast.success("Changes saved!", { id: loadingToast });
            setIsEditing(false);
            
            // Actualización local de la referencia para no esperar a un refetch
            project.name = editForm.name;
            project.description = editForm.description;
            
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed server connection.";
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
            title: '¿Are you sure?',
            text: `You are about to delete project "${project.name}". This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            background: '#1a1a1a',
            color: '#fff'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const response = await onDelete(project.id);
                
                if (response.success) {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'The project has been deleted.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#1a1a1a',
                        color: '#fff'
                    });
                } else if (response.reason === "published") {
                    // Bloqueo de seguridad: El proyecto está publicado
                    Swal.fire({
                        title: 'Acción Bloqueada',
                        text: response.message,
                        icon: 'info',
                        background: '#1a1a1a',
                        color: '#fff',
                        confirmButtonColor: '#3085d6'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: response.message,
                        icon: 'error',
                        background: '#1a1a1a',
                        color: '#fff'
                    });
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

            <div className="project-actions-vertical">
                {isEditing ? (
                    <>
                        <button className="action-btn save" onClick={handleSave} title="Guardar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button className="action-btn cancel" onClick={handleCancel} title="Cancelar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button className="action-btn enter" title="Entrar" onClick={() => window.location.assign(`/project/${project.id}`)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </button>
                        <button className="action-btn edit" onClick={() => setIsEditing(true)} title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button className="action-btn delete" onClick={handleDeleteClick} title="Eliminar">
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