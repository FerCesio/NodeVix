import { useState } from "react";
import { api } from "../services/api";
import type { LoginRequest, LoginResponse } from "../types/user";

export default function LoginForm() {
  const [form, setForm] = useState<LoginRequest>({
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
      const res = await api.post<LoginResponse>(
        "/auth/login",
        form
      );

      console.log(res.data);
      alert("Usuario inicio sesion");
    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="user_name_email"
        placeholder="Name/Email..."
        value={form.name}
        onChange={handleChange}
      />
      
      <input
        name="password"
        type="password"
        placeholder="Password..."
        value={form.password}
        onChange={handleChange}
      />

      <button type="submit">Login</button>
    </form>
  );
}