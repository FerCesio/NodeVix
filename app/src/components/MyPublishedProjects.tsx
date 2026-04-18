import { useState, useEffect } from "react";
import { api } from "../services/api";
import "../styles/userProjects.css";
import type { PostListResponse } from "../types/post"; // Usando tu DTO
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function MyPublishedProjects() {
    const [posts, setPosts] = useState<PostListResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const deletePost = async (postId: number) => {
        try {
            // Ruta corregida: sin el prefijo /api
            await api.delete(`/posts/${postId}`);
            setPosts((prev) => prev.filter(p => p.id !== postId));
            return true;
        } catch (error) {
            console.error("Error al eliminar post:", error);
            return false;
        }
    };

    const fetchMyPosts = async () => {
        try {
            setLoading(true);
            // Ruta corregida: /posts/me (o la que definiste en el GetMapping)
            const response = await api.get<PostListResponse[]>("/posts/me"); 
            setPosts(response.data);
        } catch (error) {
            console.error("Error cargando mis posts:", error);
            toast.error("No se pudieron cargar tus publicaciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyPosts();
    }, []);

    if (loading) return <div className="loader">Cargando tus publicaciones...</div>;

    return (
        <div className="projects-container">
            <h1>Posts</h1>
            
            <div className="projects-list">
                {posts.length > 0 ? (
                    posts.map((item) => (
                        <PublishedPostCard 
                            key={item.id} 
                            post={item} 
                            onDelete={deletePost} 
                        />
                    ))
                ) : (
                    <p>You haven't published anything yet</p>
                )}
            </div>
        </div>
    );
}


interface PostCardProps {
    post: PostListResponse;
    onDelete: (postId: number) => Promise<boolean>;
}

function PublishedPostCard({ post, onDelete }: PostCardProps) {
    
    const handleDeleteClick = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Project "${post.projectName}" won't be public anymore`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c0392b',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            background: '#1a1a1a',
            color: '#fff'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const success = await onDelete(post.id);
                if (success) {
                    Swal.fire({
                        title: 'Done!',
                        text: 'Post succesfully deleted.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#1a1a1a',
                        color: '#fff'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Could not delete this post',
                        icon: 'error',
                        background: '#1a1a1a',
                        color: '#fff'
                    });
                }
            }
        });
    };

    return (
        <div className="project-card wide">
            <div className="project-info">
                <h3>{post.projectName}</h3>
                <p className="project-desc">{post.projectDescription || "No description available."}</p>
                
                {/* Visualización de las métricas del DTO */}
                <div className="project-stats-row" style={{ display: 'flex', gap: '15px', marginTop: '10px', color: '#bbb', fontSize: '0.85rem' }}>
                    <span>👁️ {post.views} </span>
                    <span>👍 {post.likes} </span>
                    <span>👎 {post.dislikes} </span>
                </div>

        
            </div>

            <div className="project-actions-vertical">
                {/* Botón para ver la publicación (puedes mandarlo a la ruta de detalle del post) */}
                <button className="action-btn enter" title="Ver" onClick={() => window.location.assign(`/posts/${post.id}`)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>

                {/* Botón para borrar el post (quitarlo de la vista pública) */}
                <button 
                    className="action-btn delete" 
                    onClick={handleDeleteClick} 
                    title="Eliminar Publicación"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}