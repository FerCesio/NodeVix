package com.lab1.nodevix.colabs.dto;

public class CollaboratorDTO {
    private final Long userID;
    private final String username;
    private final String role;

    public CollaboratorDTO(Long userID, String username, String role) {
        this.userID = userID;
        this.username = username;
        this.role = role;
    }

    public Long getUserID() {
        return userID;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

}
