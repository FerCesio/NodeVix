package com.lab1.nodevix.project.dtos;

public class UsableGetResponse {
    private Long id;
    private String name;
    private String content;

    public UsableGetResponse(Long id, String name, String content) {
        this.id = id;
        this.name = name;
        this.content = content;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getContent() {
        return content;
    }
}
