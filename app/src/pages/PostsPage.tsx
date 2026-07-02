import { useState, useEffect } from "react";
import "../styles/general.css";
import { Toaster } from "react-hot-toast";
import { api } from "../services/api";
import ReturnButton from "../components/general/ReturnButton";
import type { PostListResponse } from "../types/post";

export default function PostsPage() {
    const [posts, setPosts] = useState<PostListResponse[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // --- NUEVOS ESTADOS PARA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 3; 

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // Ahora enviamos page y size como parámetros
                const response = await api.get(`/posts?page=${currentPage}&size=${pageSize}`);
                
                // Spring Data devuelve la lista en .content y el total en .totalPages
                setPosts(response.data.content); 
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error("Error al cargar posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [currentPage]); 

    const filteredPosts = posts.filter((post) => {
        const term = searchTerm.toLowerCase();
        const name = (post.projectName || "").toLowerCase();
        const desc = (post.projectDescription || "").toLowerCase();
        
        return name.includes(term) || desc.includes(term);
    });

    return (
        <div className="main-container">
            <Toaster />
            <div className="projects-container" style={{ width: '90%', maxWidth: '1200px' }}>
                <ReturnButton to="/home"/>
                <h1 className="main-title">Community Posts</h1>

                <div className="search-section">
                    <input
                        className="nav-community-input"
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="loader">Cargando comunidad...</div>
                ) : (
                    <>
                        <div className="projects-community-list">
                            {filteredPosts.length > 0 ? (
                                filteredPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            ) : (
                                <p className="main-description">No posts found matching your search.</p>
                            )}
                        </div>

                        {/* --- CONTROLES DE PAGINACIÓN --- */}
                        <div className="pagination-controls" style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            gap: '15px', 
                            marginTop: '30px',
                            paddingBottom: '20px' 
                        }}>
                            <button 
                                className="btn btn-return"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </button>
                            
                            <span className="page-info">
                                Page <strong>{currentPage + 1}</strong> of {totalPages}
                            </span>

                            <button 
                                className="btn btn-return"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PostCard({ post }: { post: PostListResponse }) {
    return (
        <div className="project-card wide postcard">
            <div className="project-info">
                <div className="post-header">
                    <h3>{post.projectName}</h3>
                </div>
                <p className="project-desc">By: {post.author}</p>
                <p className="project-desc">{post.projectDescription}</p>

                <div className="project-card-footer">
                    <span className="project-date">👁 {post.views}</span>
                    <span className="project-date">👍 {post.likes}</span>
                    <span className="project-date">👎 {post.dislikes}</span>
                </div>
            </div>

            <div className="project-actions-vertical">
                <button className="action-btn enter" title="View Simulation" onClick={() => window.location.href = `/posts/${post.id}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>
        </div>
    );
}