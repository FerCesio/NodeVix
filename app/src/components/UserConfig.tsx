import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { UpdateRequest, UpdateResponse } from "../types/user";
import "../styles/userProjects.css";
import "../styles/general.css";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import AvatarSelector from "./AvatarSelector";

export default function UserConfig() {

  const [form, setForm] = useState<UpdateRequest>({
    userName: "",
    password: "",
    avatarUrl: "" // Valor por defecto
  });
  
  // Runs when the component is used
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/users/get"); // Tu endpoint de perfil
        setForm({
          userName: response.data.name,
          password: "", // El password no se suele pedir al GET
          avatarUrl: response.data.avatarUrl || "avatar_0.png" // Sincronización clave
        });
        console.log("received: " + response.data.userName)
      } catch (error) {
        console.error("Error al cargar datos", error);
      }
    };
    fetchUserData();
  }, []);

  const handleAvatarChange = (avatarName: string) => {
    setForm({ ...form, avatarUrl: avatarName });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Como ahora todo es texto, enviamos JSON normal
      await api.put("/users/update", {
        userName: form.userName,
        password: form.password,
        avatarUrl: form.avatarUrl // Enviamos el string "avatar_x.png"
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Error updating profile");
    }
  };

  // --- BORRAR ---
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action is irreversible and will delete all your projects and data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c0392b",
      cancelButtonColor: "#333",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#fff",
    });

    if (result.isConfirmed) {
      try {
        await api.delete("/users/me");
        await Swal.fire({
          title: "Deleted!",
          text: "Your account has been deleted.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          background: "#1a1a1a",
          color: "#fff",
        });
        localStorage.removeItem("token");
        window.location.href = "/login";
      } catch (err: any) {
          const msg = err.response?.data?.message || "Could not delete account.";
          Swal.fire("Error", msg, "error");
        }
      }
  };


  return (
    <div className="user-config-view">
      <h1>- User Config -</h1>
      <p>Update your access information</p>
      <AvatarSelector 
        selectedAvatar={form.avatarUrl} 
        onSelect={handleAvatarChange} 
      />
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
      <button className="btn" style={{marginTop: '10px'}} onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("userId"); window.location.href = "/login";}}>
        <span>Log out</span>
      </button>
      <button className="btn-danger" onClick={handleDelete}>
        <span>
          Delete Account
        </span>
      </button>
    </div>
  );
}