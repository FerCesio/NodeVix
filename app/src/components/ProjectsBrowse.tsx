import { useState, useEffect } from "react";
import { api } from "../services/api";
import "../styles/userProjects.css";
import type { ReadListResponse } from "../types/project";

export default function ProjectsBrowse() {
 
    const [projects, setProjects] = useState<ReadListResponse[]>([]);
    const [loading, setLoading] = useState(true);

    
    const fetchProjects = async () => {
        try {
            setLoading(true);
            // El interceptor ya manda el token, el back sabe quién es el usuario
            
            const response = await api.get<ReadListResponse[]>("/manage"); 
            console.log("Respuesta:", response.data);
            setProjects(response.data);

               
        } catch (error) {
            console.error("Error cargando proyectos:", error);
            alert("No se pudieron cargar los proyectos");
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
                        <ProjectCard key={item.id} project={item} />
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

function ProjectCard({ project }: { project: ReadListResponse }) {
    
    const displayDate = project.modifiedOn ? project.modifiedOn.substring(0, 16) : "Sin fecha";

    return (
        <div className="project-card">
            <div className="project-info">
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                
                <div className="project-card-footer">
                    <span className="project-id">ID: {project.id}</span>
                    <span className="project-date">{displayDate}</span>
                </div>
            </div>

            <button className="btn btn-small"><span>Enter</span></button>
        </div>
    );
}


