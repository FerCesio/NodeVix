package com.lab1.nodevix.user.dtos;

public class UpdateResponse {
    private Long id;
    private String name;

    public UpdateResponse(Long id, String name) {
        this.id = id;
        this.name = name;
    }
}
