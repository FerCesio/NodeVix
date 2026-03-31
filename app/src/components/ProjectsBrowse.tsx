import { useState } from "react";
import { api } from "../services/api";
import "../styles/userProjects.css";
import type { ProjectRequest, ProjectResponse } from "../types/project";


export default function ProjectsBrowse() {
    const projects:ProjectResponse[] = [
        { id: 10, name: "Alpha", desc: "Old project", modDate: "01-02-2005", creationDate: "01-02-2005" },
        { id: 25, name: "Gamma", desc: "New project", modDate: "01-02-2005", creationDate: "01-02-2005" },
        { id: 15, name: "Beta", desc: "Mid project", modDate: "01-02-2005", creationDate: "01-02-2005" }
    ]
    
    
    // Ordenamos por prioridad (de menor a mayor)
    const sortedProjects = [...projects].sort((a, b) => {
        // 1. Dividimos el string "DD-MM-YYYY" en partes
        const [dayA, monthA, yearA] = a.modDate.split("-").map(Number);
        const [dayB, monthB, yearB] = b.modDate.split("-").map(Number);

        // 2. Creamos objetos Date (el mes en JS es 0-11, por eso restamos 1)
        const dateA = new Date(yearA, monthA - 1, dayA).getTime();
        const dateB = new Date(yearB, monthB - 1, dayB).getTime();

        // 3. Restamos para ordenar (B - A para que las más recientes vayan arriba)
        return dateB - dateA;
    });

    return (
        <div className="projects-list">
            {sortedProjects.map((item) => (
                <ProjectCard 
                    key={item.id} 
                    project={item} 
                />
            ))}
        </div>
    );
}

function ProjectCard({project}:{project:ProjectResponse}) {
    return (
    <div className="project-card">
        <div className="project-info">
            <h3>{project.name}</h3>
            <p>{project.desc}</p>
            
            {/* Este span se irá al fondo gracias al margin-top: auto */}
            <span className="project-id">id:{project.id}</span>
        </div>

        <button className="btn btn-small"><span>Enter</span></button>
    </div>
    );
}