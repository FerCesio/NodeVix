package com.lab1.nodevix.project.dtos;

import com.lab1.nodevix.project.ProjectContent;

public class ReadListResponse {
    private Long id;
    private String name;
    private String description;
    private String modifiedOn;
    private String createdOn;

    public ReadListResponse(Long id, String name, String description, String modifiedOn, String createdOn) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.modifiedOn = modifiedOn;
        this.createdOn = createdOn;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
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
