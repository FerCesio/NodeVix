import LoginForm from "../components/LoginForm"; // Importás el corazón
import "../styles/login.css";


export default function LoginPage() {

  return (
    <div className="login-container">
        <div className="login-text-section">
            <h1 className="main-title">NodeVix</h1>
            <p className="main-description">
            An interactive sandbox, for visulization of data structures and algoritmic operations and behaviours.
            </p>
        </div>
      <div className="login-card">
        <h1>Welcome</h1>
        <p>Start now</p>
        
        {/* Aquí "enchufás" el formulario que ya hicimos */}
        <LoginForm /> 

        <button className="btn-register" onClick={() => window.location.href = "/projects"}>
            <span>Create Project</span>
        </button>

        <div className="footer-links">
          <a href="/register">Don't have an account? Register</a>
        </div>
      </div>
    </div>
  );
}
