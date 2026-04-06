import { useState } from "react";
import { api } from "../services/api";
import "../styles/userProjects.css";
import type { ReadListResponse } from "../types/project";

export default function ProjectsBrowse() {
    // Estos datos ahora simulan lo que te devolvería el backend real
    const projects: ReadListResponse[] = [
        { id: 10, name: "Alpha", description: "Old project", modifiedOn: "01/02/2026 15:30:00", createdOn: "01/01/2026 10:00:00" },
        { id: 25, name: "Gamma", description: "New project", modifiedOn: "15/03/2026 18:20:10", createdOn: "10/03/2026 09:00:00" },
        { id: 15, name: "Beta", description: "Mid project", modifiedOn: "10/02/2026 12:00:00", createdOn: "05/02/2026 11:45:00" }
    ];
    
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

    return (
        <div className="projects-container">
            <h1>My projects</h1>
            <form onSubmit={(e) => e.preventDefault()}>
                <input name="searched" placeholder="Search..." className="search-input" />
            </form>
            
            <div className="projects-list">
                {sortedProjects.map((item) => (
                    <ProjectCard 
                        key={item.id} 
                        project={item} 
                    />
                ))}
            </div>

            <button className="btn">
                <span>Create Project</span>
            </button>
        </div>
    );
}

function ProjectCard({ project }: { project: ReadListResponse }) {
    // Mostramos solo Fecha y Hora sin los segundos para que quede más prolijo
    // "dd/MM/yyyy HH:mm"
    const displayDate = project.modifiedOn.substring(0, 16);

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