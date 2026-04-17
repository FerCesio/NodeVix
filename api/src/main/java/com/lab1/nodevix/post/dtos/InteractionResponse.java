package com.lab1.nodevix.post.dtos;


public class InteractionResponse {
    private int likes;
    private int dislikes;
    private int views;
    private boolean userLiked;    // Nombre más limpio para el JSON
    private boolean userDisliked;


    public InteractionResponse(int likes, int dislikes, int views, boolean userLiked, boolean userDisliked) {
        this.likes = likes;
        this.dislikes = dislikes;
        this.views = views;
        this.userLiked = userLiked;
        this.userDisliked = userDisliked;
    }

    public int getLikes() { return likes; }
    public int getDislikes() { return dislikes; }
    public int getViews() { return views; }

    public boolean isUserLiked() { return userLiked; }
    public boolean isUserDisliked() { return userDisliked; }
}