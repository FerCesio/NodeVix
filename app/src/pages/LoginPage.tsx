import LoginForm from "../components/LoginForm"; // Importás el corazón
import "../styles/login.css";
import TitleAndDesc from "./TitleAndDesc";

export default function LoginPage() {

  return (
    <div className="login-container">
      <TitleAndDesc/>
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
