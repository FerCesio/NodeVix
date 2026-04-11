import "../styles/general.css";
import { useState } from "react";

import UserConfig from "../components/UserConfig";
import TitleAndDesc from "../components/TitleAndDesc";
import ProjectsBrowse from "../components/ProjectsBrowse";

export default function HomePage() {
  // 'projects' es el valor inicial
  const [view, setView] = useState('projects');

  return (
    <div className="main-container">
        <TitleAndDesc/>
        <div className="browse-container">

          <div className="browsing_buttons">
              <ol>
                <li>
                  <button onClick={() => setView('projects')} title="Projects" className="btn btn-small">
                    <span>📁</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('user')} title="User" className="btn btn-small">
                    <span>👤</span>
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