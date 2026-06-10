export type InteractionResponse = {
    likes: number;
    dislikes: number;
    views: number;
    userLiked: boolean;
    userDisliked: boolean;
}

export type PostListResponse = {
    id: number;
    likes: number;
    dislikes: number;
    views: number;
    projectName: string;
    projectDescription: string;
    author: string
    content: string
}