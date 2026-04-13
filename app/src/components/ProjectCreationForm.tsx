import { useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom"; // Para volver a la lista tras crear
import "../styles/general.css";
import "../styles/userProjects.css";
import type { CreateProject } from "../types/project";

export default function ProjectCreationForm() {
    const [projectName, setName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newProject: CreateProject = {
            projectName: projectName 
        };

        if (!projectName.trim()) {
            alert("El nombre es obligatorio");
            return;
        }

        try {
            // El backend debería recibir un objeto con "name"
            await api.post("/manage/create", newProject);
            
            alert("¡Proyecto creado con éxito!");

        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Error al crear el proyecto");
        }
    };

    return (
        <header className="navbar-creation">

            <form onSubmit={handleSubmit} className="creation-form-nav">

                <input 
                    type="text" 
                    placeholder="Project Name..." 
                    value={projectName}
                    onChange={(e) => setName(e.target.value)}
                    className="nav-input"
                />
                
                <button type="submit" className="btn-nav">
                    <span>Create</span>
                </button>

            </form>

        </header>
    );
}