import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ProjectPage from "./pages/ProjectPage"
import HomePage from "./pages/HomePage"
import PostsPage from "./pages/PostsPage"

// JWT with spring boot
// protected paths for front

function App() {
  return (
    <BrowserRouter>
      <Routes>
          
        {/* Ruta para el Home (usuario registrado) */}
        <Route element={<ProtectedRoute/>}>
          <Route path="/home" element={<HomePage />} />
        </Route>


        <Route element={<ProtectedRoute redirectIfLogged />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        
        {/* Ruta por defecto: si entran a "/", los manda al login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Ruta para el proyecto del usuario */}
        <Route path="/project" element={<ProjectPage />} />

        {/* Ruta para el proyecto del usuario */}
        <Route path="/posts" element={<PostsPage />} />

        {/* Ruta para errores (404 Not Found) */}
        <Route path="*" element={<h1>Página no encontrada - 404</h1>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;