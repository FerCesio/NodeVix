package com.lab1.nodevix.project.dtos;

public class ProjectResponse {
    private Long id;
    private String projectName;
    private String description;

    public ProjectResponse(Long id, String projectName, String description) {
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
}
