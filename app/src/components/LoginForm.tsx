import { useState } from "react";
import { api } from "../services/api";
import type { LoginRequest, LoginResponse } from "../types/user";
import toast from "react-hot-toast";

interface Props {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: Props) {
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
      

      localStorage.setItem("token", res.data.token); // TOKEN      

      // Avisamos que todo salio bien a quien este usando el form
      if(onSuccess) onSuccess();
      
      console.log(res.data) ;
      toast.success("Welcome!");
  
      // Chequeo para evitar el cambio de ruta
      if (window.location.pathname != "/project/new") {
        window.location.href ="/home";
      }
      
    } catch (err:any) {

      if (err.response && err.response.data){
        toast.error(err.response.data.message)
      } else {
        toast.error("Failed server connection.")
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

      <button type="submit" className="btn">
        <span>Login</span>
      </button>


    </form>
  );
}