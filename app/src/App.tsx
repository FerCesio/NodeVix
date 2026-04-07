import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"
import ProjectPage from "./pages/ProjectPage"
import HomePage from "./pages/HomePage";


// JWT with spring boot
// protected paths for front

function App() {
  return (
    <BrowserRouter>
      <Routes>
          
        {/* 0. Ruta para el Home (usuario registrado) */}
        <Route path="/home" element={<HomePage />} />

        {/* 1. Ruta para el Login */}
        <Route element={<ProtectedRoute/>}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* 2. Ruta para el Registro */}
        <Route path="/register" element={<RegisterPage />} />

        {/* 3. Ruta por defecto: si entran a "/", los manda al login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* 4.Ruta para el proyecto del usuario */}
        <Route path="/project" element={<ProjectPage />} />

        {/* 5. Ruta para errores (404 Not Found) */}
        <Route path="*" element={<h1>Página no encontrada - 404</h1>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;