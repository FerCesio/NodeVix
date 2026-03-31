import ProjectsBrowse from "../components/ProjectsBrowse";
import "../styles/general.css";
import TitleAndDesc from "./TitleAndDesc";

export default function HomePage() {
  return (
    <div className="main-container">
      <TitleAndDesc/>
      <div className="basic-card">
        <h1>Your projects</h1>
        
        <form>
          <input name="searched" placeholder="Search..."></input>
        </form>
        
        <ProjectsBrowse/>
        
        <button className="btn" onClick={() => window.location.href = "/project"}>
            <span>Create Project</span>
        </button>
        
      </div>
    </div>
  );
}
