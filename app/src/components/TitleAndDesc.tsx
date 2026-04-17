import { Link } from "react-router-dom"; // Importante para navegación interna
import "../styles/general.css";

export default function TitleAndDesc() {
  return (
    <div className="main-text-section">
      <h1 className="main-title">NodeVix</h1>
      <p className="main-description">
        An interactive sandbox, for visualization of data structures and algorithmic operations and behaviors.
      </p>

      {/* Botón para ir a los proyectos de la comunidad */}
      <Link to="/posts" style={{ textDecoration: 'none' }}>
        <button className="btn">
          <span>Explore Community</span>
        </button>
      </Link>
    </div>
  );
}