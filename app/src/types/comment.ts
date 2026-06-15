export type CommentResponse = {
    id: number;
    user: string;
    message: string;
    modifiedOn: string;
    owner: boolean;
}

export type MessageRequest = {
    message: string;
}