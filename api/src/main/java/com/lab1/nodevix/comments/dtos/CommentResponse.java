package com.lab1.nodevix.comments.dtos;

public class CommentResponse {
    private Long id;
    private String user;
    private String message;
    private String modifiedOn;
    private boolean isOwner;

    public CommentResponse(Long id, String user, String message, String modifiedOn, boolean isOwner) {
        this.id = id;
        this.user = user;
        this.message = message;
        this.modifiedOn = modifiedOn;
        this.isOwner = isOwner;
    }

    public Long getId() {
        return id;
    }

    public String getUser() {
        return user;
    }

    public String getMessage() {
        return message;
    }

    public String getModifiedOn() {
        return modifiedOn;
    }

    public boolean isOwner() {
        return isOwner;
    }


}
