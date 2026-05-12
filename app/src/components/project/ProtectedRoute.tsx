import { Navigate, Outlet } from "react-router-dom";

interface Props {
  redirectIfLogged?:boolean;
}

export const ProtectedRoute = ({redirectIfLogged = false}: Props) => {
  const token = localStorage.getItem("token");

  if (redirectIfLogged){
    return token ? <Navigate to="/home" replace /> : <Outlet />;
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};