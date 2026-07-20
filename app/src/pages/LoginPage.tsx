import LoginForm from "../components/user/LoginForm";
import "../styles/general.css";
import TitleAndDesc from "../components/general/TitleAndDesc";
import BackgroundVideo from "../components/general/BackgroundVideo";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

export default function LoginPage() {

  return (
    <div className="main-container">
      <BackgroundVideo />
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
