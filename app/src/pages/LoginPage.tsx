import LoginForm from "../components/LoginForm"; // Importás el corazón
import "../styles/login.css";

export default function LoginPage() {
  return (
    <div className="login-container">
        <div className="login-text-section">
            <h1 className="main-title">NodeVix</h1>
            <p className="main-description">
            Una herramienta interactiva para visualizar algoritmos y estructuras de datos.
            </p>
        </div>
      <div className="login-card">
        <h1>Bienvenido</h1>
        <p>Ingresa tus credenciales</p>
        
        {/* Aquí "enchufás" el formulario que ya hicimos */}
        <LoginForm /> 

        <div className="footer-links">
          <a href="/register">¿No tienes cuenta? Regístrate</a>
        </div>
      </div>
    </div>
  );
}
