import RegisterForm from "../components/RegisterForm";
import "../styles/general.css";

import TitleAndDesc from "../components/TitleAndDesc";
import { Toaster } from "react-hot-toast";

export default function RegisterPage(){
    return (
        <div className="main-container">
            <TitleAndDesc/>
            <Toaster/>
            <div className="basic-card">
                <h1>New here?</h1>
            
                {/* Aquí "enchufás" el formulario que ya hicimos */}
                <RegisterForm /> 
    
            </div>
        </div>
    );
}