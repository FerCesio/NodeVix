import RegisterForm from "../components/RegisterForm";
import "../styles/register.css";


export default function RegisterPage(){
    return (
        <div className="register-container">
            <div className="register-text-section">
                <h1 className="main-title">NodeVix</h1>
                <p className="main-description">
                An interactive sandbox, for visulization of data structures and algoritmic operations and behaviours.
                </p>
            </div>
            <div className="register-card">
                <h1>New here?</h1>
            
                {/* Aquí "enchufás" el formulario que ya hicimos */}
                <RegisterForm /> 
    
            </div>
        </div>
    );
}