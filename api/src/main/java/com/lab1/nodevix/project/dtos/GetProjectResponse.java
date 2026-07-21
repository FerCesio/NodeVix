package com.lab1.nodevix.project.dtos;

public class GetProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String modifiedOn;
    private String createdOn;
    private String role;

    public GetProjectResponse(Long id, String name, String description, String modifiedOn, String createdOn, String role) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.modifiedOn = modifiedOn;
        this.createdOn = createdOn;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRole(){
        return role;
    }

    public String getDescription() {
        return description;
    }

    public String getModifiedOn() {
        return modifiedOn;
    }

    public String getCreatedOn() {
        return createdOn;
    }


}
