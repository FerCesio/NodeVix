import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // <-- AGREGADO: useLocation
import { api } from "../../services/api";
import type { LoginRequest, LoginResponse } from "../../types/user";
import toast from "react-hot-toast";

interface Props {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const navigate = useNavigate();
  const location = useLocation(); // <-- AGREGADO: Capturamos el estado de la ruta
  
  const [form, setForm] = useState<LoginRequest>({
    identifier: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.identifier.trim()) {
      toast.error("Enter your username or email.");
      return;
    }
    if (!form.password) {
      toast.error("Enter your password.");
      return;
    }

    try {
      const res = await api.post<LoginResponse>("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      toast.success("Welcome!");

      // --- CAMBIO PRINCIPAL: Lógica de redirección inteligente ---
      if (onSuccess) {
        // Si el login se usa como MODAL (ej. dentro del canvas), 
        // solo ejecutamos la función de cierre y NO navegamos a ningún lado.
        onSuccess();
      } else {
        // Si es la PÁGINA de login normal, nos fijamos si el ProtectedRoute nos mandó acá.
        // Si veníamos de un link (ej. /project/4), volvemos ahí. Si no, al /home.
        const origin = location.state?.from?.pathname || "/home";
        navigate(origin, { replace: true });
      }
      // ---------------------------------------------------------

    } catch (err: any) {
      if (err.response) {
        const msg = err.response.data?.message || err.response.data?.error;
        const status = err.response.status;

        if (status === 401 || status === 403) {
          toast.error("Invalid credentials.");
        } else if (msg) {
          toast.error(msg);
        } else {
          toast.error("Unexpected error. Try again.");
        }
      } else if (err.request) {
        toast.error("Server unreachable. Is the backend running?");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="identifier"
        placeholder="Username/Email..."
        value={form.identifier}
        onChange={handleChange}
      />
      
      <input
        name="password"
        type="password"
        placeholder="Password..."
        value={form.password}
        onChange={handleChange}
      />

      <button type="submit" className="btn">
        <span>Login</span>
      </button>
    </form>
  );
}