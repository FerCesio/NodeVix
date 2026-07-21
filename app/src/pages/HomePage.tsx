import "../styles/general.css";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import userIcon from "../assets/circulo-de-usuarios.svg";
import folderIcon from "../assets/carpeta.svg";
import myProjectsIcon from "../assets/redaccion.svg"; 

import UserConfig from "../components/user/UserConfig";
import TitleAndDesc from "../components/general/TitleAndDesc";
import PageTransition from "../components/general/PageTransition";
import ProjectsBrowse from "../components/project/ProjectsBrowse";
import MyPublishedProjects from "../components/user/MyPublishedProjects"; 
import { Toaster } from "react-hot-toast";

export default function HomePage() {
  const [view, setView] = useState('projects');

  return (
    <PageTransition>
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
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ width: "100%", height: "100%" }}
              >
                {view === 'projects' && <ProjectsBrowse />}
                {view === 'my-posts' && <MyPublishedProjects />} 
                {view === 'user' && <UserConfig />}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}