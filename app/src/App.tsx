import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "./components/project/ProtectedRoute";

import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ProjectPage from "./pages/ProjectPage"
import HomePage from "./pages/HomePage"
import PostsPage from "./pages/PostsPage"
import PostDetailPage from "./pages/PostDetailPage";
import OAuth2RedirectHandler from "./components/general/OAuth2RedirectHandler";
import BackgroundVideo from "./components/general/BackgroundVideo";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
          
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

        {/* Ruta para el proyecto recien creado */}
        <Route path="/project/new" element={<ProjectPage />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        
        {/* Ruta para el proyecto del usuario */}
        <Route path="/posts" element={<PostsPage />} />

        <Route path="/posts/:id" element={<PostDetailPage />} />

        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

        {/* Ruta para errores (404 Not Found) */}
        <Route path="*" element={<h1>Página no encontrada - 404</h1>} />
        
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <BackgroundVideo />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
