import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import "../styles/postDetail.css";
import type {CommentResponse} from "../types/comment";
import type { PostListResponse, InteractionResponse } from "../types/post";


export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<PostListResponse | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [interaction, setInteraction] = useState<InteractionResponse | null>(null);

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
                toast.error("No se pudo cargar el post.");
            }
        };
        fetchPost();
    }, [id]);

    const fetchComments = async () => {
        try {
            const res = await api.get<CommentResponse[]>(`/comments/post/${id}`);
            setComments(res.data);
        } catch {
            toast.error("No se pudieron cargar los comentarios.");
        }
    };

    const handleToggleComments = () => {
        if (!showComments && comments.length === 0) fetchComments();
        setShowComments(prev => !prev);
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await api.post<CommentResponse>(`/comments/post/${id}`, { message: newComment });
            setComments(prev => [res.data, ...prev]);
            setNewComment("");
        } catch {
            toast.error("No se pudo enviar el comentario.");
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch {
            toast.error("No se pudo borrar el comentario.");
        }
    };

    const handleLike = async () => {
        try {
            const res = await api.patch<InteractionResponse>(`/posts/${id}/like`)
            setInteraction(res.data);
            setPost(prev => prev ? { ...prev, likes: res.data.likes } : prev);
        } catch {
            toast.error("Error al dar like.");
        }
    };

    const handleDislike = async () => {
        try {
            const res = await api.patch<InteractionResponse>(`/posts/${id}/dislike`)
            setInteraction(res.data);
            setPost(prev => prev ? { ...prev, dislikes: res.data.dislikes } : prev);
        } catch {
            toast.error("Error al dar dislike.");
        }
    };

    if (!post) return <div className="loader">Cargando...</div>;

    return (
        <div className="post-detail-page">
            <Toaster />
            <div className="post-topbar">
                <div className="post-topbar-left">
                    <button className="btn btn-small" onClick={() => window.location.href = "/posts"}>
                        <span>← Back</span>
                    </button>
                    <span className="post-project-title">{post.projectName}</span>
                </div>
                <div className="post-topbar-right">
                    <span className="post-stat">👁 {post.views}</span>
                    <button className={`post-action-btn ${interaction?.userLiked ? "active" : ""}`} onClick={handleLike} disabled={!isLoggedIn}>👍 {interaction !== null ? interaction.likes : post.likes}</button>
                    <button className={`post-action-btn ${interaction?.userDisliked ? "active" : ""}`} onClick={handleDislike} disabled={!isLoggedIn}>👎 {interaction !== null ? interaction.dislikes : post.dislikes}</button>
                    <button
                        className={`post-action-btn ${showComments ? "active" : ""}`}
                        onClick={handleToggleComments}
                    >
                        💬 Comments ({comments.length})
                    </button>
                </div>
            </div>

            <div className="post-main">
                <div className="post-canvas">
                    <p style={{ color: "#555" }}>Simulation canvas</p>
                </div>

                {showComments && (
                    <div className="post-sidebar">
                        <div className="post-sidebar-header">
                            <span>Comments</span>
                            <button onClick={() => setShowComments(false)}>✕</button>
                        </div>

                        <div className="post-comments-list">
                            {comments.length === 0 && (
                                <p className="no-comments">No comments yet. Be the first!</p>
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