import { useState } from "react";
import { api } from "../services/api";
import ProjectCreationForm from "../components/ProjectCreationForm";

export default function ProjectPage() { 
        
    // 'none' es el valor inicial
    const [view, setView] = useState('none');
    
    function checkAuth() {
        // Aca revisamos si el usuario esta registrado. 
        // si NO esta registrado -> enviamos el formulario para completar y cortamos la funcion
        // es re feo.. pero funk
        if(!localStorage.getItem("userId")) { setView('form'); return; } 
        
        // Si esta registrado guardamos el proyecto usando su user_id
        
        // resquest a back -> "guardame este proyecto"
        // el back despues se ocupa de...
        // A. crear el proyecto en la DB        (si no existe)
        // B. actualizar el proyecto en la DB   (si existe)
        
                
        
        

    }
    
    
    // MUESTRA EL FORMULARIO DE LOGIN/REGISTER o UNO VACIO "(<></>)} "
    return (
        <div>
            <div>
                <input placeholder="MyProject...">
                    
                </input>
                <button onClick={() => checkAuth()}>
                    <span>Save</span>
                </button>
            </div>
            
            <div >
                {view === 'form' ? 
                (<>
                    <ProjectCreationForm/>
                    <button onClick={() => setView('none')}> 
                        <span> Close </span>
                    </button>
                </>) 
                : 
                (<></>)} 
            </div>
        </div>
    )
    
}