import { useState } from "react";
import { api } from "../services/api";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "../types/user";


interface Props {
  onSuccess?: () => void;
}

export default function RegisterForm({onSuccess}: Props) {
  
  const today = new Date().toISOString().split("T")[0].split("-");
  const year: number = parseInt(today[0]); // Convertimos a número
  const month: string = today[1];
  const day: string = today[2];

  const minAge: number = 13;
  const maxAge: number = 100;

  // Ahora la resta funciona y el resultado se inyecta en el string
  const maxDate: string = `${year - minAge}-${month}-${day}`;
  const minDate: string = `${year - maxAge}-${month}-${day}`;

    
  const [form, setForm] = useState<RegisterRequest>({
    userName: "",
    email: "",
    password: "",
    birthDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Register segment
    try {
      // 1. Intentamos el Registro
      const res = await api.post<RegisterResponse>("/auth/register", form);
      console.log("Registro exitoso:", res.data);

      // 2. Si el registro sale bien, intentamos el Login inmediatamente
      try {
        const logRes = await api.post<LoginResponse>("/auth/login", {
          // CAMBIO AQUÍ: El backend espera 'identifier', pero le pasamos el valor de 'form.email'
          identifier: form.email, 
          password: form.password 
        });

        localStorage.setItem("token", logRes.data.token);
        
        onSuccess?.();

        // 5. Gestión de navegación
        if (window.location.pathname !== "/project") {
          window.location.href = "/home";
        } else {
          alert("¡Cuenta creada y sesión iniciada!");
        }

      } catch (loginErr: any) {
        console.error("Error en login automático:", loginErr);
        alert("Cuenta creada, pero hubo un error al iniciar sesión automáticamente. Por favor, logueate manualmente.");
      }

    } catch (err: any) {
      // Manejo de errores del Registro
      if (err.response && err.response.data) {
        alert(err.response.data.message);
      } else {
        alert("Error de conexión al intentar registrarse");
      }
      console.error(err);
    }
    

  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="userName"
        placeholder="Name..."
        value={form.userName}
        onChange={handleChange}
      />

      <input
        name="email"
        type="email"
        placeholder="Email..."
        value={form.email}
        onChange={handleChange}
      />

      <input
        name="password"
        type="password"
        placeholder="Password..."
        value={form.password}
        onChange={handleChange}
      />

      {
      /*
       *  QUE CARAJO ESTA SINTAXIS DE COMENTARIOS
       */
      }
      
      
      <input
        id="birthDate"
        name="birthDate"
        type="date"
        max={maxDate}
        min={minDate}
        value={form.birthDate}
        onChange={handleChange}
      />


      <button type="submit" className="btn">
        <span>Register</span>
      </button>
    </form>
  );
}