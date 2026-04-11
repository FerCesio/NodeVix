import LoginForm from "../components/LoginForm"; // Importás el corazón
import "../styles/general.css";
import TitleAndDesc from "../components/TitleAndDesc";

export default function LoginPage() {

  return (
    <div className="main-container">
      <TitleAndDesc/>
      <div className="basic-card">
        <h1>Welcome</h1>
        <p>Start now</p>
        
      
        <LoginForm /> 

        <button className="btn" onClick={() => window.location.href = "/project"}>
            <span>Create Project</span>
        </button>

        <div className="footer-links">
          <a href="/register">Don't have an account? Register</a>
        </div>
      </div>
    </div>
  );
}
