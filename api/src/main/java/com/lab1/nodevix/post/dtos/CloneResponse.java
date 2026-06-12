package com.lab1.nodevix.post.dtos;

public class CloneResponse {
    private final Long id;
    private final String name;

    public CloneResponse(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
