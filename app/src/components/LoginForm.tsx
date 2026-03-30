import { useState } from "react";
import { api } from "../services/api";
import type { LoginRequest, LoginResponse } from "../types/user";

export default function LoginForm() {
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

    try {
      const res = await api.post<LoginResponse>(
        "/auth/login",
        form
      );

      console.log(res.data);
      alert("Usuario inicio sesion");
    } catch (err:any) {

      if (err.response && err.response.data){
        alert(err.response.data.message)
      } else {
        alert("Error de conexión con el servidor")
      }

      console.error(err);
      
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

      <button type="submit" className="btn-register">
        <span>Login</span>
      </button>


    </form>
  );
}