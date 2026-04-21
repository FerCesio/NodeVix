package com.lab1.nodevix.user.dtos;

public class UpdateResponse {
    private Long id;
    private String name;
    private String avatar;

    public UpdateResponse(Long id, String name, String avatar) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
    }
}
