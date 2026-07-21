import LoginForm from "../components/user/LoginForm";
import "../styles/general.css";
import TitleAndDesc from "../components/general/TitleAndDesc";
import PageTransition from "../components/general/PageTransition";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
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
          <button className="btn-google" onClick={() => {
            toast.loading("Redirecting to Google...");
            const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace("/api", "");
            window.location.href = `${backendBase}/oauth2/authorization/google`;
          }}>
            Login with Google
          </button>

          <button className="btn" onClick={() => navigate("/project/new")}>
              <span>Create Project</span>
          </button>

          <div className="footer-links">
            <Link to="/register">Don't have an account? Register</Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
