import { useState } from "react";
import { api } from "../services/api";
import type { ProjectRequest, ProjectResponse } from "../types/project";

import "../styles/userProjects.css";
import "../styles/general.css";

// WIP --> NO ES UNA VERSION FINAL PERO VA POR ACA LA COSA

/*
    Aqui tenemos la modificacion media y baja del usuario
    1. Cambios en nombre y contraseña -> media
    2. Poder eliminar el usuario y borrar todos los proyectos
*/
export default function UserConfig() {
  return (
    <div className="user-config-view">
      <h1>User Config</h1>
      <p>Actualiza tu información de acceso</p>
      
      <form style={{ textAlign: 'left' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
            Username
          </label>
          <input 
            type="text" 
            name="username" 
            placeholder="New user name..." 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
            Password
          </label>
          <input 
            type="password" 
            name="password" 
            placeholder="New password..." 
          />
        </div>

        <button type="submit" className="btn">
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
}