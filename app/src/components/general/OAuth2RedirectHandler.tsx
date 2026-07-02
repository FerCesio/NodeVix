import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function OAuth2RedirectHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (token) {
            localStorage.setItem("token", token);
            navigate("/home");
        } else {
            toast.error(error || "Google login failed. Try again.");
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return <div>Finalizando login...</div>;
}