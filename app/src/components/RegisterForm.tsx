import { useState } from "react";
import { api } from "../services/api";
import type { RegisterRequest, RegisterResponse } from "../types/user";

export default function RegisterForm() {
  const [form, setForm] = useState<RegisterRequest>({
    name: "",
    email: "",
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
      const res = await api.post<RegisterResponse>(
        "/auth/register",
        form
      );

      console.log(res.data);
      alert("Usuario registrado");
    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        placeholder="Nombre"
        value={form.name}
        onChange={handleChange}
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
      />

      <button type="submit">Registrarse</button>
    </form>
  );
}