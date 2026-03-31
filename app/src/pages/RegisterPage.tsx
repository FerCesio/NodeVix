import RegisterForm from "../components/RegisterForm";
import "../styles/register.css";
import "../styles/general.css";

import TitleAndDesc from "./TitleAndDesc";

export default function RegisterPage(){
    return (
        <div className="register-container">
            <TitleAndDesc/>
            <div className="register-card">
                <h1>New here?</h1>
            
                {/* Aquí "enchufás" el formulario que ya hicimos */}
                <RegisterForm /> 
    
            </div>
        </div>
    );
}