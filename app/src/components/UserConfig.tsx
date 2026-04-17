import { useState } from "react";
import { api } from "../services/api";
import type { UpdateRequest, UpdateResponse } from "../types/user";
import "../styles/userProjects.css";
import "../styles/general.css";
import toast from "react-hot-toast";

export default function UserConfig() {
  const [form, setForm] = useState<UpdateRequest>({
    userName: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: Partial<UpdateRequest> = {};
    if (form.userName.trim()) payload.userName = form.userName;
    if (form.password.trim()) payload.password = form.password;

    if (Object.keys(payload).length === 0) {
      toast("Completá al menos un campo para actualizar.");
      return;
    }

    console.log("Payload mandado: ", payload)

    try {
      const res = await api.put<UpdateResponse>("/users", payload);
      console.log(res.data);
      toast("Usuario actualizado correctamente.");
    } catch (err: any) {
      if (err.response?.data?.message) {
        toast(err.response.data.message);
      } else {
        toast("Error de conexión con el servidor.");
      }
      console.error(err);
    }
  };

  // --- BORRAR ---
  const handleDelete = async () => {
    const confirmacion = window.confirm(
      "ARE YOU SURE? This action is irreversible and will delete all your projects and data."
    );

    if (!confirmacion) return;

    try {
      
      await api.delete("/users/me"); 
      
      toast("Account deleted.");
      
      // Limpiamos todo y afuera
      localStorage.removeItem("token");
      
      window.location.href = "/login";
    } catch (err: any) {
      const msg = err.response?.data?.message || "No se pudo eliminar la cuenta.";
      toast(msg);
    }
  };

  return (
    <div className="user-config-view">
      <h1>User Config</h1>
      <p>Update your access information</p>

      <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", color: "#666" }}>
            Username
          </label>
          <input
            type="text"
            name="userName"
            placeholder="New user name..."
            value={form.userName}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", color: "#666" }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="New password..."
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn">
          <span>Save Changes</span>
        </button>
      </form>
      <button className="btn-danger" onClick={handleDelete}>
        <span>
          Delete Account
        </span>
      </button>
    </div>
  );
}