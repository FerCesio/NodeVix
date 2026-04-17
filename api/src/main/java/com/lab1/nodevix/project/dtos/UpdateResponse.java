package com.lab1.nodevix.project.dtos;

public class UpdateResponse {
    private Long id;
    private String name;
    private String description;
    private String createdOn;
    private String modifiedOn;
    private String projectContent;

    public UpdateResponse(Long id, String name, String description, String content, String modifiedOn) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.projectContent = content;
        this.modifiedOn = modifiedOn;
    }

}
