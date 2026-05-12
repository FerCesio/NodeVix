import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuth2RedirectHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            localStorage.setItem("token", token);
            navigate("/home"); // ¡Login exitoso!
        } else {
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return <div>Finalizando login...</div>;
}