export type CommentResponse = {
    id: number;
    user: string;
    message: string;
    modifiedOn: string;
    isOwner: boolean;
}

export type MessageRequest = {
    message: string;
}