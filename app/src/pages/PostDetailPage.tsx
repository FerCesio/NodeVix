import { useState, useEffect, useRef } from "react"; // <-- Importamos useRef
import { useParams, useNavigate } from "react-router-dom"; // <-- Importamos useNavigate para redirigir
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import "../styles/postDetail.css";
import type { CommentResponse, MessageRequest } from "../types/comment";
import type { PostListResponse, InteractionResponse } from "../types/post";
// IMPORTAMOS EL CANVAS Y SU INTERFAZ DE REFERENCIA
import { SimulationCanvas, type SimulationCanvasRef } from "../components/sandbox/SimulationCanvas";

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate(); // <-- Instanciamos el router
    
    // 1. Creamos la referencia para conectarnos con las entrañas del canvas
    const canvasRef = useRef<SimulationCanvasRef>(null);

    const [post, setPost] = useState<PostListResponse | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [interaction, setInteraction] = useState<InteractionResponse | null>(null);
    const [isCloning, setIsCloning] = useState(false); // <-- Estado para deshabilitar el botón mientras clona

    const isLoggedIn = !!localStorage.getItem("token");

    useEffect(() => {
        const fetchPost = async () => {
            try {
                await api.patch(`/posts/${id}/view`);
                const res = await api.get<PostListResponse>(`/posts/${id}`);
                setPost(res.data);
                if (isLoggedIn) {
                    const interactionRes = await api.get<InteractionResponse>(`/posts/${id}/interaction`);
                    setInteraction(interactionRes.data);
                }
            } catch {
                toast.error("Couldn't load post.");
            }
        };
        fetchPost();
    }, [id]);

    const fetchComments = async () => {
        try {
            if (isLoggedIn) {
                const res = await api.get<CommentResponse[]>(`/comments/post/${id}`);
                console.log("Comentarios: ", res.data);
                setComments(res.data);
            }
        } catch {
            toast.error("Couldn't load comments.");
        }
    };

    // --- FUNCIÓN ADELANTADA PARA CLONAR EL PROYECTO ---
    const handleCloneProject = async () => {
        if (!canvasRef.current || !post) return;

        setIsCloning(true);
        const loadingToast = toast.loading("Saving copy to your projects...");

        try {
            // Extraemos el estado actual del lienzo (limpio de snapshots temporales de algoritmos)
            const currentCanvasState = canvasRef.current.getCanvasState();

            const token = localStorage.getItem("token");

            // Enviamos el ID del post a tu endpoint de Java. 
            // Pasamos el JSON actual por el body por si modificó la posición de los nodos en vivo.
            const response = await api.post(`/posts/clone`, {
                name: `Copy of: ${post.projectName}`,
                content: JSON.stringify(currentCanvasState)
            },{
                headers: {
                    // El prefijo "Bearer " es crucial para que tu JWTAuthFilter lo reconozca
                    Authorization: `Bearer ${token}` 
                }
            });
                

            toast.success("Project cloned successfully!", { id: loadingToast });

            // Redirigimos al usuario directamente a la mesa de edición de su nuevo proyecto clonado
            const newProjectId = response.data.id;
            navigate(`/project/${newProjectId}`);

        } catch (error) {
            console.error("Error cloning project:", error);
            toast.error("Failed to clone project. Make sure you are logged in.", { id: loadingToast });
        } finally {
            setIsCloning(false);
        }
    };

    const handleToggleComments = () => {
        if (!showComments && comments.length === 0) fetchComments();
        setShowComments(prev => !prev);
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;

        const requestBody: MessageRequest = {
            message: newComment
        };

        try {
            const res = await api.post<CommentResponse>(`/comments/post/${id}`, requestBody);
            setComments(prev => [res.data, ...prev]);
            setNewComment("");
        } catch {
            toast.error("Couldn't send comment.");
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch {
            toast.error("Couldn't delete comment.");
        }
    };

    const handleLike = async () => {
        try {
            const res = await api.patch<InteractionResponse>(`/posts/${id}/like`)
            setInteraction(res.data);
            setPost(prev => prev ? { ...prev, likes: res.data.likes } : prev);
        } catch {
            toast.error("Failed to like.");
        }
    };

    const handleDislike = async () => {
        try {
            const res = await api.patch<InteractionResponse>(`/posts/${id}/dislike`)
            setInteraction(res.data);
            setPost(prev => prev ? { ...prev, dislikes: res.data.dislikes } : prev);
        } catch {
            toast.error("Failed to dislike.");
        }
    };

    if (!post) return <div className="loader">Cargando...</div>;

    return (
        <div className="post-detail-page">
            <Toaster />
            <div className="post-topbar">
                <div className="post-topbar-left">
                    <button className="btn" onClick={() => navigate("/posts")}>
                        <span>← Back</span>
                    </button>
                    <span className="post-project-title">{post.projectName}</span>
                </div>
                <div className="post-topbar-right" style={{ gap: '10px' }}>
                    <span className="post-stat">👁 {post.views}</span>
                    <button className={`post-action-btn ${interaction?.userLiked ? "active" : ""}`} onClick={handleLike} disabled={!isLoggedIn}>👍 {interaction !== null ? interaction.likes : post.likes}</button>
                    <button className={`post-action-btn ${interaction?.userDisliked ? "active" : ""}`} onClick={handleDislike} disabled={!isLoggedIn}>👎 {interaction !== null ? interaction.dislikes : post.dislikes}</button>
                    
                    {/* --- NUEVO BOTÓN DE CLONACIÓN ADENTRO DE LA TOPBAR --- */}
                    <button 
                        className="post-action-btn clone-btn" 
                        onClick={handleCloneProject} 
                        disabled={!isLoggedIn || isCloning}
                        style={{
                            backgroundColor: '#2ecc71',
                            color: '#fff',
                            fontWeight: '600'
                        }}
                        title="Clone this structure to your personal projects"
                    >
                        💾 Save a copy
                    </button>

                    <button
                        className={`post-action-btn ${showComments ? "active" : ""}`}
                        onClick={handleToggleComments}
                    >
                        💬 Comments ({comments.length})
                    </button>
                </div>
            </div>

            <div className="post-main">
                <div className="post-canvas" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <SimulationCanvas ref={canvasRef} initialData={post.content} readOnly={true} />
                </div>

                {showComments && (
                    <div className="post-sidebar">
                        <div className="post-sidebar-header">
                            <span>Comments</span>
                            <button onClick={() => setShowComments(false)}>✕</button>
                        </div>

                        <div className="post-comments-list">
                            {(comments.length === 0 && isLoggedIn) && (
                                <p className="no-comments">No comments yet. Be the first!</p>
                            )}
                            {(comments.length === 0 && !isLoggedIn) && (
                                <p className="no-comments">Log in to see comments.</p>
                            )}
                            {comments.map(c => (
                                <div key={c.id} className="post-comment">
                                    <div className="post-comment-header">
                                        <strong>@{c.user}</strong>
                                        {c.isOwner && (
                                            <button
                                                className="delete-comment-btn"
                                                onClick={() => handleDeleteComment(c.id)}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <p>{c.message}</p>
                                    <p>{c.modifiedOn}</p>
                                </div>
                            ))}
                        </div>

                        {isLoggedIn && (
                            <div className="post-comment-input">
                                <input
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleComment()}
                                />
                                <button className="btn btn-small" onClick={handleComment}>
                                    <span>Send</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="post-author-bar">
                <span>by @{post.author}</span>
                <span className="post-description">{post.projectDescription}</span>
            </div>
        </div>
    );
}