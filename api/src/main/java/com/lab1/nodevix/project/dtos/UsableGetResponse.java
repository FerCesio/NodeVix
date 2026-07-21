package com.lab1.nodevix.project.dtos;

public class UsableGetResponse {
    private Long id;
    private String name;
    private String content;
    private String role;

    public UsableGetResponse(Long id, String name, String content, String role) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRole(){ return role;}

    public String getContent() {
        return content;
    }
}
