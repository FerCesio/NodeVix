import { useState } from "react";
import { api } from "../services/api";
import type { RegisterRequest, RegisterResponse } from "../types/user";

export default function RegisterForm() {

  const today = new Date().toISOString().split("T")[0];

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

    try {
      const res = await api.post<RegisterResponse>("/auth/register", form);

      console.log(res.data);
      alert("Usuario registrado");
    } catch (err:any) {
      if (err.response && err.response.data) {

      alert(err.response.data.message); 

    } else {
      alert("Error de conexión con el servidor");
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

      
      <input
        id="birthDate"
        name="birthDate"
        type="date"
        max={today}
        value={form.birthDate}
        onChange={handleChange}
      />


      <button type="submit">Register</button>
    </form>
  );
}