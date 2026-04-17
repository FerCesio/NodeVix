import { useState, useEffect } from "react";
import "../styles/general.css";
import { Toaster } from "react-hot-toast";
import { api } from "../services/api";

// 1. Asegúrate de que el tipo incluya los campos que necesitas
interface Post {
    id: number;
    name: string;
    description: string;
    content?: string;
    modifiedOn: string;
    ownerUsername?: string;
    comments?: any[]; // Luego podemos definir mejor el tipo Comment
}

export default function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Endpoint para obtener todos los proyectos públicos
                const response = await api.get("/manage/all"); 
                setPosts(response.data);
            } catch (error) {
                console.error("Error al cargar posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    // Lógica de búsqueda: Match en nombre O descripción
    const filteredPosts = posts.filter((post: Post) => {
        const term = searchTerm.toLowerCase();
        return (
            post.name.toLowerCase().includes(term) || 
            (post.description && post.description.toLowerCase().includes(term))
        );
    });

    if (loading) return <div className="loader">Cargando comunidad...</div>;

    return (
        <div className="main-container">
            <Toaster />
            <div className="projects-container" style={{ width: '90%', maxWidth: '1200px' }}>
                <h1 className="main-title">Community Posts</h1>
                
                <div className="search-section">
                    <input 
                        className="search-input"
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="projects-list">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post:Post) => (
                            <PostCard key={post.id} post={post} />
                        ))
                    ) : (
                        <p className="main-description">No posts found matching your search.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function PostCard({ post } : {post: Post}) {
    const [showAllComments, setShowAllComments] = useState(false);
    
    // Suponiendo que el backend nos manda una lista de comentarios
    const comments = post.comments || []; 
    const displayComments = showAllComments ? comments : comments.slice(0, 1);

    return (
        <div className="project-card wide postcard">
            <div className="project-info">
                <div className="post-header">
                    <h3>{post.name}</h3>
                    <span className="project-id">by @{post.ownerUsername || "User"}</span>
                </div>
                <p className="project-desc">{post.description}</p>
                
                <div className="comments-section">
                    <h4 className="comments-title">Comments ({comments.length})</h4>
                    
                    {comments.length > 0 ? (
                        <div className="comments-list">
                            {displayComments.map((c, index) => (
                                <div key={index} className="comment-item">
                                    <strong>@{c.username}:</strong> <span>{c.text}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-comments">No comments yet. Be the first!</p>
                    )}

                    {comments.length > 1 && (
                        <button 
                            className="btn-link" 
                            onClick={() => setShowAllComments(!showAllComments)}
                        >
                            {showAllComments ? "Show less" : `View all ${comments.length} comments`}
                        </button>
                    )}
                </div>

                <div className="project-card-footer">
                    <span className="project-date">Shared on: {post.modifiedOn?.substring(0, 10)}</span>
                </div>
            </div>

            <div className="project-actions-vertical">
                <button className="action-btn enter" title="View Simulation">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                {/* Aquí podrías añadir un botón de "Like" en el futuro */}
            </div>
        </div>
    );
}