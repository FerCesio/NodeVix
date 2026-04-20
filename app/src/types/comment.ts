export type CommentResponse = {
    id: number;
    user: string;
    message: string;
    modifiedOn: string;
    isOwner: boolean;
}