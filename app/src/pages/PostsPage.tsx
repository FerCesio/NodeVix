import { useState, useEffect } from "react";
import "../styles/general.css";
import { Toaster } from "react-hot-toast";
import { api } from "../services/api";
import ReturnButton from "../components/ReturnButton";
import type { PostListResponse } from "../types/post";


export default function PostsPage() {
    const [posts, setPosts] = useState<PostListResponse[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await api.get<PostListResponse[]>("/posts");
                setPosts(response.data);
            } catch (error) {
                console.error("Error al cargar posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const filteredPosts = posts.filter((post) => {
        const term = searchTerm.toLowerCase();
        const name = (post.projectName || "").toLowerCase();
        const desc = (post.projectDescription || "").toLowerCase();
        
        return name.includes(term) || desc.includes(term);
    });

    if (loading) return <div className="loader">Cargando comunidad...</div>;

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

                <div className="projects-community-list">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
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
                <button className="action-btn enter" title="View Simulation">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>
        </div>
    );
}