import LoginForm from "../components/user/LoginForm"; // Importás el corazón
import "../styles/general.css";
import TitleAndDesc from "../components/general/TitleAndDesc";
import { Toaster } from "react-hot-toast";

export default function LoginPage() {

  return (
    <div className="main-container">
      <TitleAndDesc/>
      <Toaster/>
      <div className="basic-card">
        <h1>Welcome</h1>
        <p>Start now</p>
        
      
        <LoginForm/> 
        <p>
          or
        </p>
        <button className="btn-google" onClick={() => window.location.href = "http://localhost:8080/oauth2/authorization/google"}>
          Login with Google
        </button>

        <button className="btn" onClick={() => window.location.href = "/project/new"}>
            <span>Create Project</span>
        </button>

        <div className="footer-links">
          <a href="/register">Don't have an account? Register</a>
        </div>
      </div>
    </div>
  );
}
