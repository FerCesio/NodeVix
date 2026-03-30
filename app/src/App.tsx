import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Ruta para el Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. Ruta para el Registro */}
        <Route path="/register" element={<RegisterPage />} />

        {/* 3. Ruta por defecto: si entran a "/", los manda al login */}
        <Route path="/" element={<Navigate to="/login" />} />

        
        {/* Ruta para proyectos }
        <Route path="/projects" element={<ProjectPage />} /> */}

        {/* 4. Ruta para errores (404 Not Found) */}
        <Route path="*" element={<h1>Página no encontrada - 404</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;