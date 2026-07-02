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
                const viewedPosts = JSON.parse(localStorage.getItem("viewed_posts") || "[]");
                
                if (!viewedPosts.includes(id)) {
                    await api.patch(`/posts/${id}/view`);
                    
                    viewedPosts.push(id);
                    localStorage.setItem("viewed_posts", JSON.stringify(viewedPosts));
                }

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
    }, [id, isLoggedIn]);

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
                    <span className="post-stat"><svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16s5-8 14-8 14 8 14 8-5 8-14 8-14-8-14-8z"/><circle cx="16" cy="16" r="4"/></svg> {post.views}</span>
                    <button className={`post-action-btn ${interaction?.userLiked ? "active" : ""}`} onClick={handleLike} disabled={!isLoggedIn}><svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 28H4a2 2 0 01-2-2v-9a2 2 0 012-2h5m0 13V15m0 13h11.4a3 3 0 002.97-2.57l1.5-9A3 3 0 0021.92 13H20v-5a3 3 0 00-3-3l-3 8v15"/></svg> {interaction !== null ? interaction.likes : post.likes}</button>
                    <button className={`post-action-btn ${interaction?.userDisliked ? "active" : ""}`} onClick={handleDislike} disabled={!isLoggedIn}><svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4h5a2 2 0 012 2v9a2 2 0 01-2 2h-5m0-13v13m0-13H11.6a3 3 0 00-2.97 2.57l-1.5 9A3 3 0 0010.08 19H12v5a3 3 0 003 3l3-8V4"/></svg> {interaction !== null ? interaction.dislikes : post.dislikes}</button>
                    
                    {/* --- BOTÓN DE CLONACIÓN --- */}
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
                        <svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M26 28H6a2 2 0 01-2-2V6a2 2 0 012-2h14l8 8v16a2 2 0 01-2 2z"/><path d="M22 28V18H10v10M10 4v8h10"/></svg> Save a copy
                    </button>

                    <button
                        className={`post-action-btn ${showComments ? "active" : ""}`}
                        onClick={handleToggleComments}
                    >
                        <svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M28 15.5a11.4 11.4 0 01-1.2 5.2 11.5 11.5 0 01-10.3 6.3 11.4 11.4 0 01-5.2-1.2L4 28l2.2-7.3A11.4 11.4 0 015 15.5 11.5 11.5 0 0111.3 5.2 11.4 11.4 0 0116.5 4h.7A11.5 11.5 0 0128 14.8z"/></svg> Comments ({comments.length})
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
                                        
                                        {c.owner && (
                                            <button
                                                className="delete-comment-btn"
                                                onClick={() => handleDeleteComment(c.id)}
                                                title="Delete comment"
                                            >
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    width="14" 
                                                    height="14" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M3 6h18"></path>
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <p>{c.message}</p>
                                    <p className="comment-date">{c.modifiedOn}</p>
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