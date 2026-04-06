package com.lab1.nodevix.project.dtos;

public class CreateResponse {
    private Long id;
    private String projectName;
    private String description;
    private String createdOn;
    private String updatedOn;

    public CreateResponse(Long id, String projectName, String description) {
        this.id = id;
        this.projectName = projectName;
        this.description = description;
    }

    public Long getId(){
        return id;
    }

    public String getProjectName(){
        return projectName;
    }

    public String getDescription(){
        return description;
    }

    public String getCreatedOn(){
        return createdOn;
    }

    public String getUpdatedOn(){
        return updatedOn;
    }

    public void setCreatedOn(String createdOn){
        this.createdOn = createdOn;
    }

    public void setUpdatedOn(String updatedOn){
        this.updatedOn = updatedOn;
    }
}
