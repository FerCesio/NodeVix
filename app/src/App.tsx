import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";

function App() {
  return (
    <div>
      <h3>Register</h3>
      <RegisterForm />
    
      <h3>Login</h3>
      <LoginForm />
    
    </div>
  );
}

export default App;