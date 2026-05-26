import RegisterForm from "../components/user/RegisterForm";
import "../styles/general.css";

import TitleAndDesc from "../components/general/TitleAndDesc";
import { Toaster } from "react-hot-toast";
import ReturnButton from "../components/general/ReturnButton";

export default function RegisterPage(){
    return (
        <div className="main-container">
            <TitleAndDesc/>
            <Toaster/>
            <div className="basic-card">
                <h1>New here?</h1>
                <ReturnButton to="/login" />
                {/* Aquí "enchufás" el formulario que ya hicimos */}
                <RegisterForm /> 
    
            </div>
        </div>
    );
}