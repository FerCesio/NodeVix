import "../styles/general.css";
import { useState } from "react";
import userIcon from "../assets/circulo-de-usuarios.svg";
import folderIcon from "../assets/carpeta.svg";

import UserConfig from "../components/UserConfig";
import TitleAndDesc from "../components/TitleAndDesc";
import ProjectsBrowse from "../components/ProjectsBrowse";
import { Toaster } from "react-hot-toast";

export default function HomePage() {
  // 'projects' es el valor inicial
  const [view, setView] = useState('projects');

  return (
    <div className="main-container">
        <TitleAndDesc/>
        <Toaster/>
        <div className="browse-container">

          <div className="browsing_buttons">
              <ol>
                <li>
                  <button onClick={() => setView('projects')} title="Projects" className="btn btn-small">
                    <span><img src={folderIcon} alt="Folder" width={30} height={30} /></span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('user')} title="User" className="btn btn-small">
                    <span><img src={userIcon} alt="User" width={30} height={30} /></span>
                  </button>
                </li>
              </ol>
          </div>
          <div className="basic-card">
            {view === 'projects' ? (<><ProjectsBrowse /></>) : (<><UserConfig /> </>)}
          </div>
        </div>
    </div>
  );
}