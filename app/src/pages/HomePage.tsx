import "../styles/general.css";
import { useState } from "react";
import userIcon from "../assets/circulo-de-usuarios.svg";
import folderIcon from "../assets/carpeta.svg";
// Podés importar un ícono de "mis proyectos" o "check", uso folder por ahora
import myProjectsIcon from "../assets/redaccion.svg"; 

import UserConfig from "../components/UserConfig";
import TitleAndDesc from "../components/TitleAndDesc";
import ProjectsBrowse from "../components/ProjectsBrowse";
import MyPublishedProjects from "../components/MyPublishedProjects"; 
import { Toaster } from "react-hot-toast";

export default function HomePage() {
  // Ahora tenemos 3 estados: 'projects', 'user', 'my-posts'
  const [view, setView] = useState('projects');

  return (
    <div className="main-container">
        <TitleAndDesc/>
        <Toaster/>
        <div className="browse-container">

          <div className="browsing_buttons">
              <ol>
                <li>
                  <button onClick={() => setView('projects')} title="Explorar Proyectos" className={`btn btn-small ${view === 'projects' ? 'active' : ''}`}>
                    <span><img src={folderIcon} alt="Folder" width={30} height={30} /></span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('my-posts')} title="Mis Publicaciones" className={`btn btn-small ${view === 'my-posts' ? 'active' : ''}`}>
                    <span><img src={myProjectsIcon} alt="My Posts" width={30} height={30} /></span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('user')} title="Configuración de Usuario" className={`btn btn-small ${view === 'user' ? 'active' : ''}`}>
                    <span><img src={userIcon} alt="User" width={30} height={30} /></span>
                  </button>
                </li>
              </ol>
          </div>

          <div className="basic-card">
            {view === 'projects' && <ProjectsBrowse />}
            {view === 'my-posts' && <MyPublishedProjects />} 
            {view === 'user' && <UserConfig />}
          </div>

        </div>
    </div>
  );
}