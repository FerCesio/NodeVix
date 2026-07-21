import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/general.css";
import { Toaster } from "react-hot-toast";
import { api } from "../services/api";
import ReturnButton from "../components/general/ReturnButton";
import PageTransition from "../components/general/PageTransition";
import FadeIn from "../components/general/FadeIn";
import type { PostListResponse } from "../types/post";

export default function PostsPage() {
    const [posts, setPosts] = useState<PostListResponse[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [initialLoading, setInitialLoading] = useState(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- ESTADOS PARA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 6; 

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const searchParam = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : "";
                const response = await api.get(`/posts?page=${currentPage}&size=${pageSize}${searchParam}`);
                
                setPosts(response.data.content); 
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error("Error al cargar posts:", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchPosts();
    }, [currentPage, searchTerm]); 

    // Debounce: espera 400ms después de que el usuario deja de escribir
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);
        
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearchTerm(value);
            setCurrentPage(0);
        }, 400);
    };

    return (
        <PageTransition>
        <div className="main-container">
            <Toaster />
            <div className="projects-container" style={{ width: '90%', maxWidth: '1200px' }}>
                <ReturnButton to="/home"/>
                <h1 className="main-title">Community Posts</h1>

                <div className="search-section">
                    <input
                        className="nav-community-input"
                        placeholder="Search by name or description..."
                        value={searchInput}
                        onChange={handleSearchChange}
                    />
                </div>

                {initialLoading ? (
                    <div className="projects-community-list" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p className="main-description">Cargando comunidad...</p>
                    </div>
                ) : (
                    <>
                        <div className="projects-community-list" style={{ minHeight: '500px', alignContent: 'start' }}>
                            {posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <FadeIn key={post.id} delay={index * 0.06}>
                                        <PostCard post={post} />
                                    </FadeIn>
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
        </PageTransition>
    );
}

function PostCard({ post }: { post: PostListResponse }) {
    const navigate = useNavigate();
    return (
        <div className="project-card wide postcard">
            <div className="project-info">
                <div className="post-header">
                    <h3>{post.projectName}</h3>
                </div>
                <p className="project-desc">By: {post.author}</p>
                <p className="project-desc">{post.projectDescription}</p>

                <div className="project-card-footer">
                    <span className="project-date"><svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16s5-8 14-8 14 8 14 8-5 8-14 8-14-8-14-8z"/><circle cx="16" cy="16" r="4"/></svg> {post.views}</span>
                    <span className="project-date"><svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 28H4a2 2 0 01-2-2v-9a2 2 0 012-2h5m0 13V15m0 13h11.4a3 3 0 002.97-2.57l1.5-9A3 3 0 0021.92 13H20v-5a3 3 0 00-3-3l-3 8v15"/></svg> {post.likes}</span>
                    <span className="project-date"><svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4h5a2 2 0 012 2v9a2 2 0 01-2 2h-5m0-13v13m0-13H11.6a3 3 0 00-2.97 2.57l-1.5 9A3 3 0 0010.08 19H12v5a3 3 0 003 3l3-8V4"/></svg> {post.dislikes}</span>
                </div>
            </div>

            <div className="project-actions-vertical">
                <button className="action-btn enter" title="View Simulation" onClick={() => navigate(`/posts/${post.id}`)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>
        </div>
    );
}